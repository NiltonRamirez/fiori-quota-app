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
                childrenAssignments: [],
                currentWeekStart: null,
                currentWeekLabel: ""
            });
            this.getView().setModel(oViewModel);

            this._setCurrentOrNextWeek();
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
            var sWeekStart = this._formatDateForBackend(oMonday);
            oViewModel.setProperty("/currentWeekStart", sWeekStart);

            var sWeekLabel = this._formatWeekLabel(oMonday, oSunday);
            oViewModel.setProperty("/currentWeekLabel", sWeekLabel);
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

                    var aRaw = oData.results || [];
                    var aGrouped = this._groupByChild(aRaw);
                    oViewModel.setProperty("/childrenAssignments", aGrouped);
                    oViewModel.setProperty("/employeeId", sUserId);
                }.bind(this))
                .catch(function(oError) {
                    oView.setBusy(false);
                    oViewModel.setProperty("/busy", false);

                    if (oError.status === 404) {
                        oViewModel.setProperty("/childrenAssignments", []);
                    } else {
                        MessageBox.error("Error al cargar las asignaciones: " +
                            (oError.message || "Error desconocido"));
                    }
                }.bind(this));
        },

        _groupByChild: function(aRaw) {
            var aGrouped = [];
            var oGroupMap = {};

            aRaw.forEach(function(oItem) {
                if (!oGroupMap[oItem.dependentId]) {
                    oGroupMap[oItem.dependentId] = {
                        dependentId: oItem.dependentId,
                        fullName: oItem.fullName,
                        assignments: []
                    };
                    aGrouped.push(oGroupMap[oItem.dependentId]);
                }
                oGroupMap[oItem.dependentId].assignments.push(oItem);
            });

            aGrouped.forEach(function(oGroup) {
                oGroup.daysText = oGroup.assignments.map(function(a) {
                    return formatter.formatDayOfWeek(a.dayOfWeek);
                }).join(", ");

                var hasWaiting = oGroup.assignments.some(function(a) {
                    return a.assignmentStatus === "WAITING_LIST";
                });
                oGroup.overallStatus = hasWaiting ? "WAITING_LIST" : "CONFIRMED";
            });

            return aGrouped;
        },

        onEditAssignment: function(oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            var sDependentId = oContext.getProperty("dependentId");
            this.getOwnerComponent().getRouter().navTo("RouteEditAssignment", {
                dependentId: encodeURIComponent(sDependentId)
            });
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
