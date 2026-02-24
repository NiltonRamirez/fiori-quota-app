sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    return BaseObject.extend("com.ccb.quota.service.QuotaService", {
        
        constructor: function () {
            this._sBaseUrl = "/destinations/dest_int_s/http";
        },

        /**
         * Get quota overview for the week
         * @param {string} sUserId - User ID
         * @param {string} sWeekStartDate - Week start date in ISO format
         * @returns {Promise} Promise with the response
         */
        getQuotaOverview: function(sUserId, sWeekStartDate) {
            console.log("📡 Calling getQuotaOverview with:", {
                userId: sUserId,
                weekStartDate: sWeekStartDate,
                url: this._sBaseUrl + "/api/quota/overview"
            });
            return this._callService("/api/quota/overview", "POST", {
                "x-user-id": sUserId,
                "weekStartDate": sWeekStartDate
            });
        },

        /**
         * Save assignments
         * @param {string} sEmployeeId - Employee ID
         * @param {Array} aAssignments - Array of assignments
         * @returns {Promise} Promise with the response
         */
        saveAssignments: function(sEmployeeId, aAssignments) {
            return this._callService("/saveAssignments", "POST", {
                "employeeId": sEmployeeId,
                "assignments": aAssignments
            });
        },

        /**
         * Get my assignments
         * @param {string} sEmployeeId - Employee ID
         * @param {string} sWeekStartDate - Week start date in ISO format
         * @returns {Promise} Promise with the response
         */
        getMyAssignments: function(sEmployeeId, sWeekStartDate) {
            var sUrl = this._sBaseUrl + "/myAssignments?employeeId=" + 
                       encodeURIComponent(sEmployeeId) + 
                       "&weekStartDate=" + encodeURIComponent(sWeekStartDate);
            
            return fetch(sUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(this._handleResponse.bind(this));
        },

        /**
         * Cancel assignments
         * @param {string} sEmployeeId - Employee ID
         * @param {Array} aCancellations - Array of cancellations
         * @returns {Promise} Promise with the response
         */
        cancelAssignments: function(sEmployeeId, aCancellations) {
            return this._callService("/cancelAssignments", "POST", {
                "employeeId": sEmployeeId,
                "cancellations": aCancellations
            });
        },

        /**
         * Internal method to call service
         * @private
         */
        _callService: function(sEndpoint, sMethod, oData) {
            var sUrl = this._sBaseUrl + sEndpoint;
            
            console.log("🌐 Fetch Request:", {
                url: sUrl,
                method: sMethod,
                data: oData
            });

            return fetch(sUrl, {
                method: sMethod,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oData)
            })
            .then(function(response) {
                console.log("📥 Fetch Response:", {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                });
                return this._handleResponse(response);
            }.bind(this))
            .catch(function(error) {
                console.error("❌ Fetch Error:", error);
                throw error;
            });
        },

        /**
         * Handle response from service
         * @private
         */
        _handleResponse: function(response) {
            var contentType = response.headers.get("content-type");
            
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json().then(function(data) {
                    if (!response.ok) {
                        // Check if it's a business error (like no children)
                        if (data.error) {
                            return Promise.reject({
                                businessError: true,
                                error: data.error
                            });
                        }
                        return Promise.reject({
                            status: response.status,
                            message: data.message || "Error en la solicitud"
                        });
                    }
                    return data;
                });
            } else {
                if (!response.ok) {
                    return Promise.reject({
                        status: response.status,
                        message: "Error en la solicitud"
                    });
                }
                return response.text();
            }
        }
    });
});
