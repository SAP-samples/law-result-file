sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/resource/ResourceModel",
	"sap/base/Log",
	"../../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	".././layout/EqualWidthColumns",
	".././layout/ResultLine",
], function (BaseController, JSONModel, XMLView, ResourceModel, Log, formatter, Filter, FilterOperator, EqualWidthColumns, ResultLine) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.part.ResultsPrototype", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var route = oRouter.getRoute("part");
			this.oView = this.getView();
			this._checkInitialModel();
			route.attachMatched(this._onRouteMatched, this);
			this.oModel = this.getOwnerComponent().getModel("userXML");
			var tabs = this.getView().byId("iconTabBar");
		},

		valueCheck: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
		},

		_onRouteMatched: function (oEvent) {
			this._checkInitialModel();
			var oArgs = oEvent.getParameter("arguments");

			// This variable must have the name 'path' as it is checked in ManagedObject-dbg.js!! 
			// model name will be checked, everything before '>''
			// var path = "lawFile>/Systems(" + parseInt(oArgs.index) + ")";

			// create binding for System Details
			var sysIdx = oArgs.sysIndex;
			var partIdx = oArgs.partIndex;
			var _resultIdx = this._getCorrespondingResultIndex(partIdx);
			// bind part properties
			var sPath = "/Results/Part/" + _resultIdx;
			var oForm = this.oView.byId("selectedResult2");
			oForm.bindElement({
				path: sPath,
				model: "lawFile",
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function (oEvent) {
						this.oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						this.oView.setBusy(false);
					}
				}
			});
			oForm = this.oView.byId("resultTable");

			// navigate to part branch and extract data
			var _mainModelRaw = this.oModel.getData().children[0];
			var _rawSystemData = _mainModelRaw._tagMeasurementResultsHook.children[partIdx];
			// set code editor context
			var _oSysCodeEditor = this.oView.byId("resultsCE2");
			// build editor context
			this.buildEditorContext(_rawSystemData, _oSysCodeEditor);

			// bind exportTable
			var _resultTable = this.oView.byId("resultTable");
			
			var sComponentBindingPath = "/Results/Part/" + _resultIdx + "/Result/";
			// var cols = this._getNonEmptyResultColumns(partIdx);
			
			var resultTableTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Label({ text: "{GenericId}" }),
					new sap.m.Label({ text: "{Unit}" }),
/* 					new sap.m.Label({ text: "{PerStart}" }),
					new sap.m.Label({ text: "{PerEnd}" }),
					new sap.m.Label({ text: "{Attribute1}" }),
					new sap.m.Label({ text: "{Attribute2}" }),
					new sap.m.Label({ text: "{Counter}" }) */
				]
			});
			/* _resultTable.bindItems({
				path: sComponentBindingPath,
				template: resultTableTemplate
			}); */
		},
		
		_getNonEmptyResultColumns: function (iPartIndex) {
			var results = this.oModel.getData().children[0]._tagMeasurementResultsHook.children;
			
			var corRes = results[iPartIndex];
			
			// loop over children
			for (var i = 0; i < corRes.children.length; ++i) {
				var nextNode = corRes.children[i];
				var nodeName = nextNode.nodeName;
				if (nodeName) {
					if (nodeName.trim().toLowerCase() === "result") {
						// console.log("Child: " + nextNode.children);
					}
					// ignore tags different from 'Result', particularly the 'PartId' tag
				}
			}
			// if no system was found return -1
			return -1;
		}, 		

		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("selectedResult2").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("System number can't be found");
			}
		}
	});
});