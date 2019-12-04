sap.ui.define([ 
	"sap/ui/model/json/JSONModel",
   "sap/ui/model/resource/ResourceModel"
	], 
	function (JSONModel, ResourceModel) {
		"use strict";
	return {
		
		/** returns true if the value is not null/undefined, otherwise false */
		exists: function (sVal) {
			if (!sVal) {
				return false;
			}
			return true;
		},

		/*
		// read msg from i18n model
         var oBundle = this.getView().getModel("i18n").getResourceBundle();
         var sMsg = oBundle.getText("helloMsg", [sRecipient]);
		
		*/
		
		formatClient: function (sClient, sGenId, sPartId) {
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			return this.__proto__.formatter.formatClientRb(sClient, sGenId, sPartId, resourceBundle);
		},

		formatClientRb: function (sClient, sGenId, sPartId, resourceBundle) {
			if (!sClient) {
				if (sGenId) {
					if (sGenId.toUpperCase().startsWith("PRTX")) {
						return resourceBundle.getText("model.parts.part.PRTX.text");
					}
					if (sGenId.toUpperCase().startsWith("PRTC")) {
						return resourceBundle.getText("model.parts.part.PRTC.text");
					}
				}
				return resourceBundle.getText("model.parts.part.partId.text") + " " + sPartId;
			} 
			return "Client " + sClient;
		},

		formatStatus: function (sStatus) {
			if (!sStatus) {
				return "<cite>(n.a.)</cite>";
			}
			
			switch (sStatus) {
				case "00":
					return "00 <cite>(Complete Measured)</cite>";
				case "01":
					return "01 <cite>(System will be deleted)</cite>";
				case "02":
					return "02 <cite>(Wrong system status, will be changed)</cite>";
				case "03":
					return "03 <cite>(No system access, belongs to another company)</cite>";
				case "04":
					return "04 <cite>(Technically not measurable (no ABAP stack))</cite>";
				case "05":
					return "05 <cite>(System number in measurement result is initial)</cite>";
				case "06":
					return "06 <cite>(System not in use/ not yet productive)</cite>";
				case "09":
					return "09 <cite>(LAW (only) System)</cite>";
				default:
					return sStatus + " <cite>(unknown)</cite>";
			}
			// return "-->" + status;
		},
		
		statusText: function (sStatus) {
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			switch (sStatus) {
				case "A":
					return resourceBundle.getText("invoiceStatusA");
				case "B":
					return resourceBundle.getText("invoiceStatusB");
				case "C":
					return resourceBundle.getText("invoiceStatusC");
				default:
					return sStatus;
			}
		},
		
		formatCell: function (sGenId) {
			if (sGenId) {
				if (sGenId.toUpperCase().startsWith("PRTX")) {
					return "bbtn--secondary";
				}
				if (sGenId.toUpperCase().startsWith("PRTC")) {
					return "bbtn--secondary";
				}
			}
			return "bbtn";
		},

		formatTime: function (sTime) {
			 if (sTime && sTime.length == 6 ) {
				return sTime.substr(0,2) + ":" + sTime.substr(2,2) + " (:" + sTime.substr(4,2) + "s)";
				 // return sTime.substr(0,2) + "h " + sTime.substr(2,2) + "min " + sTime.substr(4,2) + "sec";
			 }
			 return sTime;
		 }		
	};
});