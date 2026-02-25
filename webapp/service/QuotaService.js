sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    return BaseObject.extend("com.ccb.quota.service.QuotaService", {
        
        constructor: function () {
            // Base URL para el destination configurado en BTP
            this._sBaseUrl = "/destinations/dest_int_s";
            // CSRF Token for POST requests
            this._sCsrfToken = null;
        },

        /**
         * Fetch CSRF Token from backend
         * @private
         * @returns {Promise} Promise with CSRF token
         */
        _fetchCsrfToken: function() {
            // If we already have a token, return it
            if (this._sCsrfToken) {
                return Promise.resolve(this._sCsrfToken);
            }

            // Fetch CSRF token with GET request (some backends don't support HEAD)
            var sUrl = this._sBaseUrl + "/http/cancelAssignments";
            
            console.log("🔐 Fetching CSRF Token from:", sUrl);
            
            return fetch(sUrl, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                }
            })
            .then(function(response) {
                console.log("📥 Token Fetch Response:", {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                });
                
                var sToken = response.headers.get("X-CSRF-Token");
                if (sToken) {
                    console.log("✅ CSRF Token obtained:", sToken.substring(0, 20) + "...");
                    this._sCsrfToken = sToken;
                    return sToken;
                } else {
                    console.log("⚠️ No CSRF Token in response headers, proceeding without it");
                    return null;
                }
            }.bind(this))
            .catch(function(error) {
                console.error("❌ Error fetching CSRF Token:", error);
                // Continue without token
                return null;
            });
        },

        /**
         * Get quota overview for the week
         * Endpoint: POST /http/api/quota/overview
         * @param {string} sUserId - User ID (x-user-id en body)
         * @param {string} sWeekStartDate - Week start date in ISO format
         * @returns {Promise} Promise with the response
         */
        getQuotaOverview: function(sUserId, sWeekStartDate) {
            console.log("📡 Calling getQuotaOverview with:", {
                userId: sUserId,
                weekStartDate: sWeekStartDate,
                url: this._sBaseUrl + "/http/api/quota/overview"
            });
            return this._callService("/http/api/quota/overview", "POST", {
                "x-user-id": sUserId,
                "weekStartDate": sWeekStartDate
            });
        },

        /**
         * Save assignments
         * Endpoint: POST /http/saveAssignments
         * @param {string} sEmployeeId - Employee ID
         * @param {Array} aAssignments - Array of assignments
         * @returns {Promise} Promise with the response
         */
        saveAssignments: function(sEmployeeId, aAssignments) {
            console.log("📡 Calling saveAssignments with:", {
                employeeId: sEmployeeId,
                assignmentsCount: aAssignments.length,
                url: this._sBaseUrl + "/http/saveAssignments"
            });
            return this._callService("/http/saveAssignments", "POST", {
                "employeeId": sEmployeeId,
                "assignments": aAssignments
            });
        },

        /**
         * Get my assignments
         * Endpoint: GET /http/myAssignments?employeeId={id}&weekStartDate={date}
         * @param {string} sEmployeeId - Employee ID
         * @param {string} sWeekStartDate - Week start date in ISO format
         * @returns {Promise} Promise with the response
         */
        getMyAssignments: function(sEmployeeId, sWeekStartDate) {
            var sEndpoint = "/http/myAssignments?employeeId=" + 
                            encodeURIComponent(sEmployeeId) + 
                            "&weekStartDate=" + encodeURIComponent(sWeekStartDate);
            
            console.log("📡 Calling getMyAssignments with:", {
                employeeId: sEmployeeId,
                weekStartDate: sWeekStartDate,
                endpoint: sEndpoint
            });
            
            return this._callService(sEndpoint, "GET");
        },

        /**
         * Cancel assignments
         * Endpoint: POST /http/cancelAssignments
         * @param {string} sEmployeeId - Employee ID
         * @param {Array} aCancellations - Array of cancellations
         * @returns {Promise} Promise with the response
         */
        cancelAssignments: function(sEmployeeId, aCancellations) {
            console.log("📡 Calling cancelAssignments with:", {
                employeeId: sEmployeeId,
                cancellationsCount: aCancellations.length,
                url: this._sBaseUrl + "/http/cancelAssignments"
            });
            return this._callService("/http/cancelAssignments", "POST", {
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

            // For POST, PUT, DELETE methods, fetch CSRF token first
            if (sMethod === "POST" || sMethod === "PUT" || sMethod === "DELETE") {
                return this._fetchCsrfToken().then(function(sToken) {
                    var oHeaders = {
                        "Content-Type": "application/json"
                    };
                    
                    // Add CSRF token if available
                    if (sToken) {
                        oHeaders["X-CSRF-Token"] = sToken;
                        console.log("🔐 Including CSRF Token in request");
                    }

                    return fetch(sUrl, {
                        method: sMethod,
                        headers: oHeaders,
                        body: JSON.stringify(oData)
                    })
                    .then(function(response) {
                        console.log("📥 Fetch Response:", {
                            status: response.status,
                            statusText: response.statusText,
                            ok: response.ok
                        });
                        
                        // If 403, token might be expired, reset it
                        if (response.status === 403) {
                            console.log("⚠️ 403 Forbidden - resetting CSRF token");
                            this._sCsrfToken = null;
                        }
                        
                        return this._handleResponse(response);
                    }.bind(this))
                    .catch(function(error) {
                        console.error("❌ Fetch Error:", error);
                        throw error;
                    });
                }.bind(this));
            } else {
                // For GET requests, no CSRF token needed
                return fetch(sUrl, {
                    method: sMethod,
                    headers: {
                        "Content-Type": "application/json"
                    }
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
            }
        },

        /**
         * Handle response from service
         * @private
         */
        _handleResponse: function(response) {
            // Always try to parse as JSON first since our backend returns JSON
            return response.text().then(function(text) {
                console.log("📦 Raw response text:", text);
                
                var data;
                try {
                    data = JSON.parse(text);
                    console.log("✅ Parsed JSON data:", data);
                } catch (e) {
                    console.error("❌ Failed to parse JSON:", e);
                    console.error("Raw text:", text);
                    return Promise.reject({
                        status: response.status,
                        message: "Error parsing JSON response"
                    });
                }
                
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
        }
    });
});
