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
                selectedForCancellation: [],
                currentWeekStart: null,
                currentWeekLabel: ""
            });
            this.getView().setModel(oViewModel);

            // Set initial week to current week
            this._setCurrentWeek(new Date());
            
            // Load assignments
            this._loadAssignments();
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
                    oView.setBusy(false);
                    oViewModel.setProperty("/busy", false);
                    
                    // Process assignments data
                    var aAssignments = oData.assignments || [];
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
            var sEmployeeId = oViewModel.getProperty("/employeeId");

            oView.setBusy(true);

            var oQuotaService = this.getOwnerComponent().getQuotaService();
            oQuotaService.cancelAssignments(sEmployeeId, aCancellations)
                .then(function(oData) {
                    oView.setBusy(false);

                    // Count cancelled
                    var iCancelled = 0;
                    if (oData.results) {
                        oData.results.forEach(function(oResult) {
                            if (oResult.cancellationStatus === "CANCELLED") {
                                iCancelled++;
                            }
                        });
                    }

                    MessageBox.success("Se cancelaron " + iCancelled + " asignaciones exitosamente", {
                        onClose: function() {
                            // Reload assignments
                            this._loadAssignments();
                            
                            // Clear selection
                            var oTable = this.byId("assignmentsTable");
                            oTable.removeSelections(true);
                        }.bind(this)
                    });
                }.bind(this))
                .catch(function(oError) {
                    oView.setBusy(false);
                    MessageBox.error("Error al cancelar las asignaciones: " + 
                        (oError.message || "Error desconocido"));
                }.bind(this));
        },

        onRefresh: function() {
            this._loadAssignments();
            MessageToast.show("Actualizando información...");
        },

        onPreviousWeek: function() {
            var oViewModel = this.getView().getModel();
            var sCurrentWeek = oViewModel.getProperty("/currentWeekStart");
            var oDate = new Date(sCurrentWeek);
            oDate.setDate(oDate.getDate() - 7);
            this._setCurrentWeek(oDate);
            this._loadAssignments();
        },

        onNextWeek: function() {
            var oViewModel = this.getView().getModel();
            var sCurrentWeek = oViewModel.getProperty("/currentWeekStart");
            var oDate = new Date(sCurrentWeek);
            oDate.setDate(oDate.getDate() + 7);
            this._setCurrentWeek(oDate);
            this._loadAssignments();
        },

        onNavBack: function() {
            this.getOwnerComponent().getRouter().navTo("RouteQuotaAssignment");
        }
    });
});
