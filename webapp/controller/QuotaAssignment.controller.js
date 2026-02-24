sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "com/ccb/quota/model/formatter",
    "sap/ui/core/format/DateFormat"
], function (Controller, JSONModel, MessageBox, MessageToast, formatter, DateFormat) {
    "use strict";

    return Controller.extend("com.ccb.quota.controller.QuotaAssignment", {
        
        formatter: formatter,

        onInit: function () {
            var oViewModel = new JSONModel({
                busy: false,
                hasChildren: false,
                children: [],
                selectedCount: 0,
                currentWeekStart: null,
                currentWeekLabel: "",
                noChildrenMessage: ""
            });
            this.getView().setModel(oViewModel);

            // Set initial week to current week
            this._setCurrentWeek(new Date());
            
            // Load quota overview
            this._loadQuotaOverview();
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

        _loadQuotaOverview: function() {
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
            oQuotaService.getQuotaOverview(sUserId, sWeekStartDate)
                .then(function(oData) {
                    console.log("✅ Service Response Data:", oData);
                    console.log("🔍 Type of oData:", typeof oData);
                    console.log("🔍 oData.children exists:", !!oData.children);
                    console.log("🔍 oData.children type:", typeof oData.children);
                    console.log("🔍 oData.children length:", oData.children ? oData.children.length : "undefined");
                    console.log("🔍 Is Array:", Array.isArray(oData.children));
                    
                    oView.setBusy(false);
                    oViewModel.setProperty("/busy", false);
                    
                    // Process children data
                    if (oData.children && oData.children.length > 0) {
                        console.log("✅ Processing", oData.children.length, "children");
                        
                        // Initialize selected property for each day
                        oData.children.forEach(function(oChild) {
                            oChild.days.forEach(function(oDay) {
                                oDay.selected = false;
                            });
                        });

                        // Prepare weekDays for table headers (5 days: Monday-Friday)
                        var aWeekDays = [];
                        if (oData.children[0] && oData.children[0].days) {
                            for (var i = 0; i < Math.min(5, oData.children[0].days.length); i++) {
                                var oDay = oData.children[0].days[i];
                                aWeekDays.push({
                                    dayOfWeek: oDay.dayOfWeek,
                                    date: oDay.date,
                                    quotaText: oDay.remainingQuota + " cupos disponibles"
                                });
                            }
                        }

                        oViewModel.setProperty("/hasChildren", true);
                        oViewModel.setProperty("/children", oData.children);
                        oViewModel.setProperty("/employeeId", oData.employeeId);
                        oViewModel.setProperty("/weekDays", aWeekDays);
                        
                        console.log("✅ Data set in model. HasChildren:", oViewModel.getProperty("/hasChildren"));
                        console.log("✅ Children count:", oViewModel.getProperty("/children").length);
                    } else {
                        console.log("⚠️ No children found in response");
                        console.log("🔍 Condition check - oData.children:", oData.children);
                        console.log("🔍 Condition check - length:", oData.children ? oData.children.length : "N/A");
                        oViewModel.setProperty("/hasChildren", false);
                        oViewModel.setProperty("/children", []);
                        oViewModel.setProperty("/noChildrenMessage", "No hay hijos registrados o no hay cupos disponibles para esta semana");
                    }
                }.bind(this))
                .catch(function(oError) {
                    oView.setBusy(false);
                    oViewModel.setProperty("/busy", false);

                    if (oError.businessError && oError.error) {
                        // Business error - no children
                        oViewModel.setProperty("/hasChildren", false);
                        oViewModel.setProperty("/noChildrenMessage", oError.error.message.value);
                    } else {
                        MessageBox.error("Error al cargar la información de cupos: " + 
                            (oError.message || "Error desconocido"));
                    }
                }.bind(this));
        },

        onDaySelected: function(oEvent) {
            var oCheckBox = oEvent.getSource();
            var bSelected = oCheckBox.getSelected();
            var oContext = oCheckBox.getBindingContext();
            var oDay = oContext.getObject();

            // Check if day has NO_QUOTA and warn about waiting list
            if (bSelected && oDay.disabledReason === "NO_QUOTA") {
                MessageBox.warning(
                    "Este día no tiene cupos disponibles. Su solicitud será agregada a la lista de espera.",
                    {
                        title: "Lista de Espera",
                        onClose: function(sAction) {
                            if (sAction !== MessageBox.Action.OK) {
                                oCheckBox.setSelected(false);
                                oContext.getModel().setProperty(oContext.getPath() + "/selected", false);
                            }
                            this._updateSelectedCount();
                        }.bind(this)
                    }
                );
            }

            this._updateSelectedCount();
        },

        onDaySelectedInTable: function(oEvent) {
            var oCheckBox = oEvent.getSource();
            var bSelected = oCheckBox.getSelected();
            
            // Get the binding context and day index from custom data
            var oContext = oCheckBox.getBindingContext();
            var iDayIndex = parseInt(oCheckBox.data("dayIndex"), 10);
            
            if (oContext) {
                // Get the child object path
                var sPath = oContext.getPath();
                // Update the selected property for the specific day
                var oViewModel = this.getView().getModel();
                oViewModel.setProperty(sPath + "/days/" + iDayIndex + "/selected", bSelected);
                
                this._updateSelectedCount();
            }
        },

        onCancel: function() {
            // Clear all selections
            var oViewModel = this.getView().getModel();
            var aChildren = oViewModel.getProperty("/children") || [];

            aChildren.forEach(function(oChild) {
                oChild.days.forEach(function(oDay) {
                    oDay.selected = false;
                });
            });

            oViewModel.setProperty("/children", aChildren);
            this._updateSelectedCount();
            
            MessageToast.show("Selecciones canceladas");
        },

        _updateSelectedCount: function() {
            var oViewModel = this.getView().getModel();
            var aChildren = oViewModel.getProperty("/children") || [];
            var iCount = 0;

            aChildren.forEach(function(oChild) {
                oChild.days.forEach(function(oDay) {
                    if (oDay.selected) {
                        iCount++;
                    }
                });
            });

            oViewModel.setProperty("/selectedCount", iCount);
        },

        onSelectAll: function() {
            var oViewModel = this.getView().getModel();
            var aChildren = oViewModel.getProperty("/children") || [];

            aChildren.forEach(function(oChild) {
                oChild.days.forEach(function(oDay) {
                    // Only select if available and not already assigned
                    // Allow selection even for NO_QUOTA (waiting list)
                    if ((oDay.available || oDay.disabledReason === "NO_QUOTA") && 
                        !oDay.alreadyAssigned) {
                        oDay.selected = true;
                    }
                });
            });

            oViewModel.setProperty("/children", aChildren);
            this._updateSelectedCount();
        },

        onSaveAssignments: function() {
            var oViewModel = this.getView().getModel();
            var aChildren = oViewModel.getProperty("/children") || [];
            var sEmployeeId = oViewModel.getProperty("/employeeId");
            var aAssignments = [];

            // Collect selected days
            aChildren.forEach(function(oChild) {
                oChild.days.forEach(function(oDay) {
                    if (oDay.selected && !oDay.alreadyAssigned) {
                        aAssignments.push({
                            dependentId: oChild.dependentId,
                            date: oDay.date
                        });
                    }
                });
            });

            if (aAssignments.length === 0) {
                MessageToast.show("Por favor seleccione al menos un día");
                return;
            }

            // Confirm save
            MessageBox.confirm(
                "¿Está seguro de guardar las asignaciones seleccionadas?",
                {
                    title: "Confirmar Asignaciones",
                    onClose: function(sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            this._performSave(sEmployeeId, aAssignments);
                        }
                    }.bind(this)
                }
            );
        },

        _performSave: function(sEmployeeId, aAssignments) {
            var oView = this.getView();
            oView.setBusy(true);

            var oQuotaService = this.getOwnerComponent().getQuotaService();
            oQuotaService.saveAssignments(sEmployeeId, aAssignments)
                .then(function(oData) {
                    oView.setBusy(false);

                    // Check for waiting list assignments
                    var aWaitingList = [];
                    var aConfirmed = [];

                    if (oData.results) {
                        oData.results.forEach(function(oResult) {
                            if (oResult.assignmentStatus === "WAITING_LIST") {
                                aWaitingList.push(oResult);
                            } else {
                                aConfirmed.push(oResult);
                            }
                        });
                    }

                    // Show result message
                    var sMessage = "Asignaciones guardadas exitosamente.\n";
                    sMessage += "Confirmadas: " + aConfirmed.length + "\n";
                    
                    if (aWaitingList.length > 0) {
                        sMessage += "En lista de espera: " + aWaitingList.length;
                    }

                    MessageBox.success(sMessage, {
                        onClose: function() {
                            // Reload overview
                            this._loadQuotaOverview();
                        }.bind(this)
                    });
                }.bind(this))
                .catch(function(oError) {
                    oView.setBusy(false);
                    MessageBox.error("Error al guardar las asignaciones: " + 
                        (oError.message || "Error desconocido"));
                });
        },

        onRefresh: function() {
            this._loadQuotaOverview();
            MessageToast.show("Actualizando información...");
        },

        onPreviousWeek: function() {
            var oViewModel = this.getView().getModel();
            var sCurrentWeek = oViewModel.getProperty("/currentWeekStart");
            var oDate = new Date(sCurrentWeek);
            oDate.setDate(oDate.getDate() - 7);
            this._setCurrentWeek(oDate);
            this._loadQuotaOverview();
        },

        onNextWeek: function() {
            var oViewModel = this.getView().getModel();
            var sCurrentWeek = oViewModel.getProperty("/currentWeekStart");
            var oDate = new Date(sCurrentWeek);
            oDate.setDate(oDate.getDate() + 7);
            this._setCurrentWeek(oDate);
            this._loadQuotaOverview();
        },

        onNavigateToMyAssignments: function() {
            this.getOwnerComponent().getRouter().navTo("RouteMyAssignments");
        }
    });
});
