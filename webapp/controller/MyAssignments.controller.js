sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "com/ccb/quota/model/formatter",
    "sap/ui/core/format/DateFormat"
], function (Controller, JSONModel, MessageBox, MessageToast, formatter, DateFormat) {
    "use strict";

    return Controller.extend("com.ccb.quota.controller.MyAssignments", {
        
        formatter: formatter,

        onInit: function () {
            var oViewModel = new JSONModel({
                busy: false,
                assignments: [],
                currentWeekStart: null,
                currentWeekLabel: ""
            });
            this.getView().setModel(oViewModel);

            // Set week based on current day (next week from Friday onward)
            this._setCurrentOrNextWeek();
            
            // Wait for user resolution before loading data
            this._waitForUserAndLoad();
        },

        _waitForUserAndLoad: function(iAttempt) {
            var iCurrentAttempt = iAttempt || 0;
            var oAppModel = this.getOwnerComponent().getModel("app");
            var sUserId = oAppModel && oAppModel.getProperty("/userId");

            if (sUserId) {
                this._loadAssignments();
                return;
            }

            // Retry for up to ~5 seconds (20 * 250ms)
            if (iCurrentAttempt >= 20) {
                MessageToast.show("No se pudo obtener el ID de usuario");
                return;
            }

            setTimeout(function() {
                this._waitForUserAndLoad(iCurrentAttempt + 1);
            }.bind(this), 250);
        },

        _setCurrentOrNextWeek: function() {
            var oToday = new Date();
            var dayOfWeek = oToday.getDay();

            // Monday-Thursday: current week. Friday-Sunday: next Monday.
            if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
                var iDaysUntilNextMonday = (8 - dayOfWeek) % 7;
                oToday.setDate(oToday.getDate() + iDaysUntilNextMonday);
            }
            
            this._setCurrentWeek(oToday);
        },

        _setCurrentWeek: function(oDate) {
            // Get Monday of the week
            var oMonday = new Date(oDate);
            var day = oMonday.getDay();
            var diff = oMonday.getDate() - day + (day === 0 ? -6 : 1);
            oMonday.setDate(diff);
            oMonday.setHours(0, 0, 0, 0);

            var oSunday = new Date(oMonday);
            oSunday.setDate(oMonday.getDate() + 6);

            var oViewModel = this.getView().getModel();
            // Format date as YYYY-MM-DDTHH:mm:ss.SSS (without Z)
            var sWeekStart = this._formatDateForBackend(oMonday);
            oViewModel.setProperty("/currentWeekStart", sWeekStart);
            
            // Format week label
            var sWeekLabel = this._formatWeekLabel(oMonday, oSunday);
            oViewModel.setProperty("/currentWeekLabel", sWeekLabel);
        },

        _formatDateForBackend: function(oDate) {
            // Format: YYYY-MM-DDTHH:mm:ss.SSS (without Z timezone)
            var year = oDate.getFullYear();
            var month = String(oDate.getMonth() + 1).padStart(2, '0');
            var day = String(oDate.getDate()).padStart(2, '0');
            var hours = String(oDate.getHours()).padStart(2, '0');
            var minutes = String(oDate.getMinutes()).padStart(2, '0');
            var seconds = String(oDate.getSeconds()).padStart(2, '0');
            var milliseconds = String(oDate.getMilliseconds()).padStart(3, '0');
            
            return year + '-' + month + '-' + day + 'T' + 
                   hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
        },

        _formatWeekLabel: function(oStart, oEnd) {
            var oDateFormat = DateFormat.getDateInstance({
                pattern: "dd/MM/yyyy"
            });
            return "Semana del " + oDateFormat.format(oStart) + " al " + oDateFormat.format(oEnd);
        },

        _loadAssignments: function() {
            var oView = this.getView();
            var oViewModel = oView.getModel();
            var oAppModel = this.getOwnerComponent().getModel("app");
            var sUserId = oAppModel.getProperty("/userId");
            var sWeekStartDate = oViewModel.getProperty("/currentWeekStart");

            if (!sUserId) {
                MessageToast.show("No se pudo obtener el ID de usuario");
                return;
            }

            oView.setBusy(true);
            oViewModel.setProperty("/busy", true);

            var oQuotaService = this.getOwnerComponent().getQuotaService();
            oQuotaService.getMyAssignments(sUserId, sWeekStartDate)
                .then(function(oData) {
                    console.log("✅ Assignments Response:", oData);
                    console.log("🔍 Type of oData:", typeof oData);
                    console.log("🔍 oData.results:", oData.results);
                    
                    oView.setBusy(false);
                    oViewModel.setProperty("/busy", false);
                    
                    // Process assignments data - backend returns 'results' not 'assignments'
                    var aAssignments = oData.results || [];
                    console.log("✅ Assignments array length:", aAssignments.length);
                    oViewModel.setProperty("/assignments", aAssignments);
                    oViewModel.setProperty("/employeeId", sUserId);
                }.bind(this))
                .catch(function(oError) {
                    oView.setBusy(false);
                    oViewModel.setProperty("/busy", false);
                    
                    // If no assignments found, just show empty list
                    if (oError.status === 404) {
                        oViewModel.setProperty("/assignments", []);
                    } else {
                        MessageBox.error("Error al cargar las asignaciones: " + 
                            (oError.message || "Error desconocido"));
                    }
                }.bind(this));
        },

        onCancelSelected: function() {
            var oTable = this.byId("assignmentsTable");
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageToast.show("Por favor seleccione al menos una asignación para cancelar");
                return;
            }

            // Collect cancellations
            var aCancellations = [];
            aSelectedItems.forEach(function(oItem) {
                var oContext = oItem.getBindingContext();
                var oAssignment = oContext.getObject();
                aCancellations.push({
                    dependentId: oAssignment.dependentId,
                    date: oAssignment.date
                });
            });

            // Confirm cancellation
            MessageBox.confirm(
                "¿Está seguro de cancelar las " + aCancellations.length + " asignaciones seleccionadas?",
                {
                    title: "Confirmar Cancelación",
                    onClose: function(sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            this._performCancellation(aCancellations);
                        }
                    }.bind(this)
                }
            );
        },

        _performCancellation: function(aCancellations) {
            var oView = this.getView();
            var oViewModel = oView.getModel();
            var sUserId = oViewModel.getProperty("/employeeId");

            oView.setBusy(true);

            var oQuotaService = this.getOwnerComponent().getQuotaService();
            oQuotaService.cancelAssignments(sUserId, aCancellations)
                .then(function(oData) {
                    oView.setBusy(false);

                    // Clear table selection
                    var oTable = this.byId("assignmentsTable");
                    oTable.removeSelections(true);

                    // Analyze results
                    var iTotalCancellations = aCancellations.length;
                    var iSuccessful = 0;
                    var iFailed = 0;
                    var aFailedMessages = [];

                    if (oData.results) {
                        oData.results.forEach(function(oResult) {
                            if (oResult.cancellationStatus === "CANCELLED") {
                                iSuccessful++;
                            } else if (oResult.cancellationStatus === "FAILED") {
                                iFailed++;
                                aFailedMessages.push(
                                    oResult.dependentId + " (" + oResult.date + "): " + 
                                    (oResult.errorMessage || "Error desconocido")
                                );
                            }
                        });
                    }

                    // Show appropriate message based on status
                    var sMessage = "";
                    var sTitle = "";

                    if (oData.status === "SUCCESS") {
                        sMessage = "Todas las cancelaciones se realizaron exitosamente.\n";
                        sMessage += "Total cancelado: " + iSuccessful;
                        sTitle = "Cancelaci\u00f3n Exitosa";
                        MessageBox.success(sMessage, {
                            title: sTitle,
                            onClose: function() {
                                this._loadAssignments();
                            }.bind(this)
                        });
                    } else if (oData.status === "PARTIAL_SUCCESS") {
                        sMessage = "Algunas cancelaciones no se pudieron completar.\n\n";
                        sMessage += "Cancelaciones exitosas: " + iSuccessful + "\n";
                        sMessage += "Cancelaciones fallidas: " + iFailed + "\n\n";
                        if (aFailedMessages.length > 0) {
                            sMessage += "Detalles de errores:\n" + aFailedMessages.join("\n");
                        }
                        sTitle = "Cancelaci\u00f3n Parcial";
                        MessageBox.warning(sMessage, {
                            title: sTitle,
                            onClose: function() {
                                this._loadAssignments();
                            }.bind(this)
                        });
                    } else if (oData.status === "ERROR") {
                        sMessage = "No se pudieron cancelar las asignaciones.\n\n";
                        if (aFailedMessages.length > 0) {
                            sMessage += "Detalles de errores:\n" + aFailedMessages.join("\n");
                        }
                        MessageBox.error(sMessage, {
                            title: "Error en Cancelaci\u00f3n"
                        });
                    }
                }.bind(this))
                .catch(function(oError) {
                    oView.setBusy(false);
                    MessageBox.error("Error al cancelar las asignaciones: " + 
                        (oError.message || "Error desconocido"));
                }.bind(this));
        },

        onRefresh: function() {
            this._loadAssignments();
            MessageToast.show("Actualizando asignaciones...");
        },

        onNavBack: function() {
            this.getOwnerComponent().getRouter().navTo("RouteQuotaAssignment");
        }
    });
});
