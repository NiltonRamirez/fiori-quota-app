sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";

    return {
        /**
         * Format day label
         */
        formatDayLabel: function(sDate, sDayOfWeek) {
            if (!sDate) {
                return "";
            }
            var oDate = new Date(sDate);
            var oDateFormat = DateFormat.getDateInstance({
                pattern: "dd/MM"
            });
            var sDayName = this._getDayName(sDayOfWeek);
            return sDayName + " " + oDateFormat.format(oDate);
        },

        /**
         * Format quota status
         */
        formatQuotaStatus: function(iRemainingQuota, bAvailable, bAlreadyAssigned, sDisabledReason) {
            if (bAlreadyAssigned) {
                return "Ya asignado";
            }
            if (sDisabledReason === "HOLIDAY") {
                return "Festivo";
            }
            if (sDisabledReason === "ABSENCE") {
                return "Ausentismo";
            }
            if (sDisabledReason === "NO_QUOTA") {
                return "Lista de espera";
            }
            if (!bAvailable) {
                return "No disponible";
            }
            return iRemainingQuota + " cupos";
        },

        /**
         * Get day box CSS class
         */
        getDayBoxClass: function(bAvailable, bAlreadyAssigned, sDisabledReason) {
            if (bAlreadyAssigned) {
                return "quotaDayBox quotaDayAssigned";
            }
            if (sDisabledReason === "HOLIDAY" || sDisabledReason === "ABSENCE") {
                return "quotaDayBox quotaDayDisabled";
            }
            if (sDisabledReason === "NO_QUOTA") {
                return "quotaDayBox quotaDayWaitingList";
            }
            if (bAvailable) {
                return "quotaDayBox quotaDayAvailable";
            }
            return "quotaDayBox quotaDayDisabled";
        },

        /**
         * Get quota status CSS class
         */
        getQuotaStatusClass: function(iRemainingQuota, bAvailable, sDisabledReason) {
            if (sDisabledReason === "NO_QUOTA") {
                return "quotaStatusWarning";
            }
            if (!bAvailable || sDisabledReason) {
                return "quotaStatusError";
            }
            if (iRemainingQuota < 10) {
                return "quotaStatusWarning";
            }
            return "quotaStatusSuccess";
        },

        /**
         * Check if day is selectable
         */
        isDaySelectable: function(bAvailable, bAlreadyAssigned, sDisabledReason) {
            // Already assigned - cannot select
            if (bAlreadyAssigned) {
                return false;
            }
            // Holiday or Absence - cannot select
            if (sDisabledReason === "HOLIDAY" || sDisabledReason === "ABSENCE") {
                return false;
            }
            // Available or NO_QUOTA (waiting list) - can select
            return bAvailable || sDisabledReason === "NO_QUOTA";
        },

        /**
         * Get status icon
         */
        getStatusIcon: function(bAlreadyAssigned, sDisabledReason) {
            if (bAlreadyAssigned) {
                return "sap-icon://accept";
            }
            if (sDisabledReason === "HOLIDAY") {
                return "sap-icon://calendar";
            }
            if (sDisabledReason === "ABSENCE") {
                return "sap-icon://warning";
            }
            if (sDisabledReason === "NO_QUOTA") {
                return "sap-icon://attendance";
            }
            return "";
        },

        /**
         * Get status color
         */
        getStatusColor: function(bAlreadyAssigned, sDisabledReason) {
            if (bAlreadyAssigned) {
                return "green";
            }
            if (sDisabledReason) {
                return "orange";
            }
            return "default";
        },

        /**
         * Check if has status icon
         */
        hasStatusIcon: function(bAlreadyAssigned, sDisabledReason) {
            return bAlreadyAssigned || !!sDisabledReason;
        },

        /**
         * Format date
         */
        formatDate: function(sDate) {
            if (!sDate) {
                return "";
            }
            var oDate = new Date(sDate);
            var oDateFormat = DateFormat.getDateInstance({
                pattern: "dd/MM/yyyy"
            });
            return oDateFormat.format(oDate);
        },

        /**
         * Format day of week
         */
        formatDayOfWeek: function(sDayOfWeek) {
            return this._getDayName(sDayOfWeek);
        },

        /**
         * Format assignment status
         */
        formatAssignmentStatus: function(sStatus) {
            switch(sStatus) {
                case "CONFIRMED":
                    return "Confirmado";
                case "WAITING_LIST":
                    return "Lista de Espera";
                case "CANCELLED":
                    return "Cancelado";
                default:
                    return sStatus;
            }
        },

        /**
         * Get assignment status state
         */
        getAssignmentStatusState: function(sStatus) {
            switch(sStatus) {
                case "CONFIRMED":
                    return "Success";
                case "WAITING_LIST":
                    return "Warning";
                case "CANCELLED":
                    return "Error";
                default:
                    return "None";
            }
        },

        /**
         * Get day name in Spanish
         * @private
         */
        _getDayName: function(sDayOfWeek) {
            var mDayNames = {
                "MONDAY": "Lunes",
                "TUESDAY": "Martes",
                "WEDNESDAY": "Miércoles",
                "THURSDAY": "Jueves",
                "FRIDAY": "Viernes",
                "SATURDAY": "Sábado",
                "SUNDAY": "Domingo"
            };
            return mDayNames[sDayOfWeek] || sDayOfWeek;
        }
    };
});
