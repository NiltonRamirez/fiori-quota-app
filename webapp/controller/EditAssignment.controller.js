sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "com/ccb/quota/model/formatter",
    "sap/ui/core/format/DateFormat"
], function (Controller, JSONModel, MessageBox, MessageToast, formatter, DateFormat) {
    "use strict";

    return Controller.extend("com.ccb.quota.controller.EditAssignment", {

        formatter: formatter,

        onInit: function () {
            var oViewModel = new JSONModel({
                busy: false,
                children: [],
                weekDays: [],
                currentWeekStart: null,
                currentWeekLabel: "",
                employeeId: null,
                dependentId: null,
                termsAccepted: false,
                privacyAccepted: false
            });
            this.getView().setModel(oViewModel);

            this._setCurrentOrNextWeek();

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteEditAssignment").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function(oEvent) {
            var sDependentId = decodeURIComponent(oEvent.getParameter("arguments").dependentId);
            var oViewModel = this.getView().getModel();
            oViewModel.setProperty("/dependentId", sDependentId);
            oViewModel.setProperty("/termsAccepted", false);
            oViewModel.setProperty("/privacyAccepted", false);
            oViewModel.setProperty("/children", []);

            this._waitForUserAndLoad();
        },

        _waitForUserAndLoad: function(iAttempt) {
            var iCurrentAttempt = iAttempt || 0;
            var oAppModel = this.getOwnerComponent().getModel("app");
            var sUserId = oAppModel && oAppModel.getProperty("/userId");

            if (sUserId) {
                this._loadEditData();
                return;
            }

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

            if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
                var iDaysUntilNextMonday = (8 - dayOfWeek) % 7;
                oToday.setDate(oToday.getDate() + iDaysUntilNextMonday);
            }

            this._setCurrentWeek(oToday);
        },

        _setCurrentWeek: function(oDate) {
            var oMonday = new Date(oDate);
            var day = oMonday.getDay();
            var diff = oMonday.getDate() - day + (day === 0 ? -6 : 1);
            oMonday.setDate(diff);
            oMonday.setHours(0, 0, 0, 0);

            var oSunday = new Date(oMonday);
            oSunday.setDate(oMonday.getDate() + 6);

            var oViewModel = this.getView().getModel();
            oViewModel.setProperty("/currentWeekStart", this._formatDateForBackend(oMonday));
            oViewModel.setProperty("/currentWeekLabel", this._formatWeekLabel(oMonday, oSunday));
        },

        _formatDateForBackend: function(oDate) {
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
            var oDateFormat = DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" });
            return "Semana del " + oDateFormat.format(oStart) + " al " + oDateFormat.format(oEnd);
        },

        _loadEditData: function() {
            var oView = this.getView();
            var oViewModel = oView.getModel();
            var oAppModel = this.getOwnerComponent().getModel("app");
            var sUserId = oAppModel.getProperty("/userId");
            var sWeekStartDate = oViewModel.getProperty("/currentWeekStart");
            var sDependentId = oViewModel.getProperty("/dependentId");

            if (!sUserId) {
                MessageToast.show("No se pudo obtener el ID de usuario");
                return;
            }

            oView.setBusy(true);
            oViewModel.setProperty("/busy", true);

            var oQuotaService = this.getOwnerComponent().getQuotaService();
            oQuotaService.getQuotaOverview(sUserId, sWeekStartDate)
                .then(function(oData) {
                    oView.setBusy(false);
                    oViewModel.setProperty("/busy", false);

                    if (!oData.children || oData.children.length === 0) {
                        MessageBox.error("No se encontró información de cupos");
                        return;
                    }

                    // Find the specific child to edit
                    var oChild = oData.children.find(function(c) {
                        return c.dependentId === sDependentId;
                    });

                    if (!oChild) {
                        MessageBox.error("No se encontró la información del dependiente");
                        return;
                    }

                    // Initialize day state: assigned days start checked, track original state
                    oChild.days.forEach(function(oDay) {
                        oDay.originallyAssigned = oDay.alreadyAssigned || false;
                        oDay.selected = oDay.alreadyAssigned || false;
                    });

                    // Build weekDays headers
                    var aWeekDays = [];
                    for (var i = 0; i < Math.min(5, oChild.days.length); i++) {
                        var oDay = oChild.days[i];
                        aWeekDays.push({
                            dayOfWeek: oDay.dayOfWeek,
                            date: oDay.date,
                            quotaText: oDay.remainingQuota + " cupos disponibles"
                        });
                    }

                    oViewModel.setProperty("/children", [oChild]);
                    oViewModel.setProperty("/employeeId", oData.employeeId);
                    oViewModel.setProperty("/weekDays", aWeekDays);
                }.bind(this))
                .catch(function(oError) {
                    oView.setBusy(false);
                    oViewModel.setProperty("/busy", false);

                    if (oError.businessError && oError.error) {
                        MessageBox.error(oError.error.message.value);
                    } else {
                        MessageBox.error("Error al cargar la información: " +
                            (oError.message || "Error desconocido"));
                    }
                }.bind(this));
        },

        onSelectAllForChild: function(oEvent) {
            var oCheckBox = oEvent.getSource();
            var bSelected = oCheckBox.getSelected();
            var oContext = oCheckBox.getBindingContext();

            if (!oContext) {
                return;
            }

            var sPath = oContext.getPath();
            var oViewModel = this.getView().getModel();
            var oChild = oViewModel.getProperty(sPath);

            oChild.days.forEach(function(oDay, iIndex) {
                if (oDay.available || oDay.alreadyAssigned) {
                    oViewModel.setProperty(sPath + "/days/" + iIndex + "/selected", bSelected);
                }
            });
        },

        onDaySelectedInTable: function(oEvent) {
            var oCheckBox = oEvent.getSource();
            var bSelected = oCheckBox.getSelected();
            var oContext = oCheckBox.getBindingContext();
            var iDayIndex = parseInt(oCheckBox.data("dayIndex"), 10);

            if (oContext) {
                var sPath = oContext.getPath();
                var oViewModel = this.getView().getModel();
                oViewModel.setProperty(sPath + "/days/" + iDayIndex + "/selected", bSelected);
            }
        },

        onSaveChanges: function() {
            var oViewModel = this.getView().getModel();
            var bTerms = oViewModel.getProperty("/termsAccepted");
            var bPrivacy = oViewModel.getProperty("/privacyAccepted");

            if (!bTerms || !bPrivacy) {
                MessageToast.show("Debe aceptar los términos y la política de datos personales");
                return;
            }

            var aChildren = oViewModel.getProperty("/children") || [];
            var sEmployeeId = oViewModel.getProperty("/employeeId");
            var aCancellations = [];
            var aNewAssignments = [];

            aChildren.forEach(function(oChild) {
                oChild.days.forEach(function(oDay) {
                    if (oDay.originallyAssigned && !oDay.selected) {
                        aCancellations.push({ dependentId: oChild.dependentId, date: oDay.date });
                    } else if (!oDay.originallyAssigned && oDay.selected) {
                        aNewAssignments.push({ dependentId: oChild.dependentId, date: oDay.date });
                    }
                });
            });

            if (aCancellations.length === 0 && aNewAssignments.length === 0) {
                MessageToast.show("No hay cambios para guardar");
                return;
            }

            MessageBox.confirm(
                "¿Confirma los cambios en su reserva?",
                {
                    title: "Confirmar Cambios",
                    onClose: function(sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            this._performEditSave(sEmployeeId, aCancellations, aNewAssignments);
                        }
                    }.bind(this)
                }
            );
        },

        _performEditSave: function(sEmployeeId, aCancellations, aNewAssignments) {
            var oView = this.getView();
            oView.setBusy(true);

            var oQuotaService = this.getOwnerComponent().getQuotaService();
            var aPromises = [];

            if (aCancellations.length > 0) {
                aPromises.push(oQuotaService.cancelAssignments(sEmployeeId, aCancellations));
            }
            if (aNewAssignments.length > 0) {
                aPromises.push(oQuotaService.saveAssignments(sEmployeeId, aNewAssignments));
            }

            Promise.all(aPromises)
                .then(function() {
                    oView.setBusy(false);
                    MessageBox.success("Cambios guardados exitosamente", {
                        onClose: function() {
                            this.getOwnerComponent().getRouter().navTo("RouteMyAssignments");
                        }.bind(this)
                    });
                }.bind(this))
                .catch(function(oError) {
                    oView.setBusy(false);
                    MessageBox.error("Error al guardar los cambios: " +
                        (oError.message || "Error desconocido"));
                }.bind(this));
        },

        onRefresh: function() {
            var oViewModel = this.getView().getModel();
            oViewModel.setProperty("/termsAccepted", false);
            oViewModel.setProperty("/privacyAccepted", false);
            this._loadEditData();
            MessageToast.show("Actualizando información...");
        },

        onOpenTermsAndConditions: function() {
            var sUrl = sap.ui.require.toUrl("com/ccb/quota") + "/doc-condiciones";
            window.open(sUrl, "_blank", "noopener,noreferrer");
        },

        onOpenPrivacyPolicy: function() {
            var sUrl = sap.ui.require.toUrl("com/ccb/quota") + "/doc-politicas";
            window.open(sUrl, "_blank", "noopener,noreferrer");
        },

        onNavBack: function() {
            this.getOwnerComponent().getRouter().navTo("RouteMyAssignments");
        }
    });
});
