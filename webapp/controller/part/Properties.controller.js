sap.ui.define([
	"../BaseController",
	"sap/base/Log"
], function (BaseController, Log) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.part.Properties", {
		
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var route = oRouter.getRoute("part");
			this.oView = this.getView();
			this.oModel = this.getOwnerComponent().getModel("userXML");
			route.attachMatched(this._onRouteMatched, this);
		
			var tabs = this.getView().byId("iconTabBar");
		},

		_onRouteMatched : function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
			this.oView.setModel(this.oModel);
			
			// create binding for System Details
			var sysIdx = oArgs.sysIndex;
			var partIdx = oArgs.partIndex;

			// bind part properties
			var sPath="/Parts/Part/" + partIdx;
			var oForm = this.oView.byId("selectedPart");
			oForm.bindElement( { 
				path: sPath, 
				events : {
					change: this._onBindingChange.bind(this),
					dataRequested: function (oEvent) {
						this.oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						this.oView.setBusy(false);
					}
				}
			}); 
			// set index property
			this.oView.byId("indexProperty").setText(partIdx);

			// navigate to part branch and extract data
			var _mainModelRaw = this.oModel.getData().children[0];
			var _rawSystemData = _mainModelRaw._tagMeasurementPartsHook.children[partIdx];
			// set code editor context
			var _oSysCodeEditor = this.oView.byId("propertiesCE");
			// build editor context
			this.buildEditorContext(_rawSystemData, _oSysCodeEditor);
		},
		
		_onBindingChange : function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("selectedPart").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("System number can't be found");
			}
		}
	});
});