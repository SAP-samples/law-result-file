sap.ui.define([
	"./BaseController",
	"sap/ui/model/resource/ResourceModel"

], function (BaseController, ResourceModel) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.controller.Intro", {
		onInit: function () {
			// set i18n model on view
			var i18nModel = new ResourceModel({
				bundleName: "sap.support.zglacelx.i18n.i18n"
			});
			this.getView().setModel(i18nModel, "i18n");
		},

		onUseExampleFile: function () {			
			// this.resetXmlBlockSelectors();

			// load sample XML file and process it
			var sampleModel = this.getOwnerComponent().getModel("sampleXML");
			var _oModel = this.getOwnerComponent().getModel("userXML");
			_oModel.setData(sampleModel.getData());
			this.storeLocalRawXML(sampleModel.getXML());
			this._processXML(_oModel.getData());
			// loading and processing of sample XML file is already done in onInit
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("elements");
		},

		handleSelectXMLFile: function (oEvent) {		
			// this.resetXmlBlockSelectors();

			// select file 
			if (oEvent.getParameter("files") && oEvent.getParameter("files")[0]) {
				this._oFile = oEvent.getParameter("files")[0];
			}

			// upload file (previously handleParseXMLFile: function (oEvent) {
			var that = this;
			if (this._oFile && window.FileReader) {
				var oFileReader = new FileReader();
				var _oModel = this.getOwnerComponent().getModel("userXML");
				oFileReader.onload = function (loadEvent) {
					var sRawXML = loadEvent.target.result;
					that.storeLocalRawXML(sRawXML);
					_oModel.setXML(sRawXML);
					that._processXML(_oModel.getData());
					var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
					oRouter.navTo("elements");
					that.oView.byId("fileSelector").clear();
				};
				oFileReader.readAsText(this._oFile);
			}
		},
		
		/* resetXmlBlockSelectors: function () {	
			// this._selectorResetFlag = true;
			
			try {	
				var drop = this.getView("header").byId("drop");				
				drop.removeAllItems(); 
				console.log("Cleaned drop-down selector of Header-View");
			} catch (err) {
				console.log("Can't clean drop-down selector of Header-View:" + err.message);				
			}
			try {	
				this.getView("part").byId("drop").removeAllItems(); 
				console.log("Cleaned drop-down selector of Part-View");
			} catch (err) {				
				console.log("Can't clean drop-down selector of Header-View:" + err.message);
			}
			try {	
				this.getView("system").byId("drop").removeAllItems(); 
				console.log("Cleaned drop-down selector of System-View");
			} catch (err) {				
				console.log("Can't clean drop-down selector of System-View:" + err.message);
			} 
		} */
	});
});