sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"./layout/EqualWidthColumns",
	"./layout/ResultLine",
	"./layout/ClearLine",
	"sap/ui/core/routing/History"

], function (BaseController, formatter, Filter, FilterOperator, EqualWidthColumns, ResultLine, ClearLine, History) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.controller.Header", {
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRoute = this.oRouter.getRoute("header");			
			this.oRoute.attachMatched(this._onRouteMatched, this);	

			this._checkInitialModel();
			this._oModel = this.getOwnerComponent().getModel("userXML");
			this.oView = this.getView();
			this.oView.setModel(this._oModel);
			this.sCoreBindingPath = "/Header/";

			// set code editor context
			var _mainModelRaw = this._oModel.getData().children[0];
			var _rawSystemData = _mainModelRaw._tagMeasurementHeaderHook;
			var _oCodeEditor = this.byId("headerCodeEditor");
			_oCodeEditor.setMaxLines(100000000);
			this.buildEditorContext(_rawSystemData, _oCodeEditor);

			/* for CodeEditor theme testing only
			var testArea = this.oView.byId("test");	
			var styles = [ "dreamweaver", "crimson_editor", "iplastic", "sqlserver", "textmate", "dawn",
						"tomorrow", "theme-ambiance", "default", "github", "chrome", "xcode", "katzenmilch", "kuroir", "eclipse", "solarized_light", "clouds", 
						"hcb", "hcb_bright", "hcb_blue", "chaos",  "clouds_midnight", "cobalt",   "gob", "gruvbox", "idle_fingers",  "kr_theme","merbivore", "merbivore_soft", "mono_industrial", "monokai", 
						"pastel_on_dark", "solarized_dark", "terminal",  "tomorrow_night", "tomorrow_night_blue", "tomorrow_night_bright", "tomorrow_night_eighties", "twilight" ];
			for (var i = 0; i < styles.length; i++) {
				var vBox = new sap.m.CustomListItem();		

				var newLb = new sap.m.Label( { text: styles[i]});
				vBox.addContent(newLb);
				var newEd = new sap.ui.codeeditor.CodeEditor( { id: styles[i], colorTheme: styles[i], type: "xml", editable: false, width: "400px" });
				this.buildEditorContext(_rawSystemData, newEd);
				vBox.addContent(newEd);
				testArea.addItem(vBox);
			} */

			var porpPanel = this.oView.byId("propSec");			
			var panL = new sap.ui.layout.VerticalLayout( { width: "100%" }); 
			
			var section, displayText, title;
			
			for (var j = 0; j < this._oModel.getData().children[0]._tagMeasurementHeaderHook.childElementCount; j++) {
				section = this._oModel.getData().children[0]._tagMeasurementHeaderHook.children[j];

				if (section.childElementCount > 0) {
					title = new ClearLine({ style: "elxCL1" }); 
					panL.addContent(title);

					title = new sap.m.Title ({ text: section.tagName, level: "H3" });
					title.addStyleClass("sapUiTinyMarginTop");
					panL.addContent(title);

					if (section.childElementCount > 0)
					for (var i = 0; i < section.childElementCount; i++) {
						displayText = this._getTagTranslation (section.children[i].tagName,	section.tagName, false,	section.children[i].innerHTML, null); 

						panL.addContent(
							new ResultLine ({
								label: displayText,
								tag: section.children[i].tagName,
								text: section.children[i].innerHTML,
								skipTopMargin: true}) 
						);	
						porpPanel.addContent(panL);
					}
				}
			}
		},

		_onRouteMatched: function (oEvent) {
			var ddList = this.oView.byId("drop");
			ddList = this._getCodeSelector(ddList, "header");
		},

		_writeAllPropertyLines: function (mainArea, _result, partIdx) {
			mainArea.addContent(
				new ResultLine ({
					label: this._translate("i18n>part.page.index.text"),
					tag: "",
					text: partIdx,
					skipTopMargin: false }) );

			var resLine = 0;
			var labelUiText;

			while (resLine < _result.children.length) {
				var curResult = _result.children[resLine];
				if (curResult) {					labelUiText = this._getTagTranslation(curResult.tagName, curResult.textContent);
					if (typeof labelUiText !== "string") {
						labelUiText = curResult.tagName;
					}
					labelUiText = this._translate(labelUiText);
					mainArea.addContent(
						new ResultLine ({
							// title: labelUiText,
							label: labelUiText,
							tag: curResult.tagName,
							text: curResult.innerHTML,
							skipTopMargin: true }) );
				}
				resLine++;
			}
		},

		onAfterRendering: function() {
		},

		navToNext: function () {			
			this.oRouter.navTo("system", {
				sysIndex: 0
			});
		},

		onElements: function () {
			this.oRouter.navTo("elements");
		},

		navToFirstSystem: function () {			
			this.oRouter.navTo("system", {
				sysIndex: 0
			});
		},

		onNavLoad: function() {
			this.oRouter.navTo("intro");
		},

		onNavAll: function() {
			this.oRouter.navTo("elements");
		},
		
		back: function (oEvent) {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.oRouter.navTo("elements");
			}
		}

	});
});