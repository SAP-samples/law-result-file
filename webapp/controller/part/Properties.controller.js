sap.ui.define([
	"../BaseController",
	"sap/base/Log",
	".././layout/EqualWidthColumns"
], function (BaseController, Log, EqualWidthColumns) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.controller.part.Properties", {
		
		onInit: function () {
			// debugger;
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.route = this.oRouter.getRoute("part");
			this.oView = this.getView();
			this._checkInitialModel();
			this._oModel = this.getOwnerComponent().getModel("userXML");
			this.route.attachMatched(this._onRouteMatched, this);
			this.iPartsCount = this._oModel.getData().children[0]._tagMeasurementPartsHook.childElementCount;
			this.iSystemsCount = this._oModel.getData().children[0]._tagMeasurementSystemsHook.childElementCount;
		
			var tabs = this.getView().byId("iconTabBar");
		},

		_onRouteMatched : function (oEvent) {
			// debugger;
			var oArgs = oEvent.getParameter("arguments");
			this.oView.setModel(this._oModel);
			
			// create binding for System Details
			this.sysIdx = oArgs.sysIndex;
			this.partIdx = oArgs.partIndex;

			// bind part properties
			var sPath="/Parts/Part/" + this.partIdx;
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
			this.oView.byId("indexProperty").setText("[" + this.partIdx + "]");

			// navigate to part branch and extract data
			var _mainModelRaw = this._oModel.getData().children[0];
			var _rawSystemData = _mainModelRaw._tagMeasurementPartsHook.children[this.partIdx];
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
		},
		
		navToFirstSystem: function() {
			var _iSysIndex = this._getCorrespondingSystem(0);
			this.oRouter.navTo("part", {
				partIndex: 0,
				sysIndex: _iSysIndex
			});
		},
		
		navToNextSystem: function() {
			var _iPartIndex = parseInt(this.partIdx) + 1;
			var _iSysIndex = this._getCorrespondingSystem(_iPartIndex);
			if (_iPartIndex <= this.iPartsCount && _iSysIndex >= 0 && _iSysIndex <= this.iSystemsCount) {
				this.oRouter.navTo("part", {
					partIndex: _iPartIndex,
					sysIndex: _iSysIndex
				});
			}
		},
		
		navToPrevSystem: function() {
			var _iPartIndex = parseInt(this.partIdx) - 1;
			var _iSysIndex = this._getCorrespondingSystem(_iPartIndex);
			if (_iPartIndex <= this.iPartsCount && _iSysIndex >= 0 && _iSysIndex <= this.iSystemsCount) {
				this.oRouter.navTo("part", {
					partIndex: _iPartIndex,
					sysIndex: _iSysIndex
				});
			}
		},
		
		navToLastSystem: function() {
			var _iPartIndex = this.iPartsCount - 1;
			var _iSysIndex = this._getCorrespondingSystem(_iPartIndex);
			if (_iPartIndex <= this.iPartsCount && _iSysIndex >= 0 && _iSysIndex <= this.iSystemsCount) {
				this.oRouter.navTo("part", {
					partIndex: _iPartIndex,
					sysIndex: _iSysIndex
				});
			}
		}
	});
});