sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/resource/ResourceModel",
	"sap/base/Log",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"./layout/ResultLine",
	"./layout/EqualWidthColumns",
	"./layout/ClearLine",
	"sap/base/i18n/ResourceBundle",
	"sap/m/Label",
	"sap/m/Panel",
	"sap/m/Link",
	"sap/ui/codeeditor/CodeEditor",
	"sap/m/List",
	"sap/m/ListItemBase",
	"sap/ui/layout/HorizontalLayout",
	"sap/m/CustomListItem",
	"sap/ui/layout/VerticalLayout",
	"sap/m/Title",
	"sap/ui/core/routing/History"
], function (BaseController, JSONModel, XMLView, ResourceModel, Log, formatter, Filter, FilterOperator, ResultLine,
	EqualWidthColumns, ClearLine,
	ResourceBundle, Label, Panel, Link, CodeEditor, List, ListItemBase, HorizontalLayout, CustomListItem, VerticalLayout, Title, History) {
	"use strict";

	var _firstLinesToShow = 5;

	var _i18nBundle; // holds the resource bundle for text translation
	// var _translatableTags;	// holds the set of tags with 'tag' and 'trans' attributes from the tagsTranslation.json file;
	// 'tags' list XML tags from LAW which needs to be explaned, 'trans' the corresponding translation
	// example: tag <PerStart> will be replaced by "from" for the description part

	// var _translatableTexts;	// holds the set of texts where either 'tag' should  match a tag or a provided text should start with 'innerHTML', or both.
	// 
	// var _engineNames;	// is an copy of the TUUNT table in JSON format which holds the texts and function modules for the engine IDs. 
	// In contrast to the LAW results, Ids are provided here without leading 0s.
	/* 			"engineNames": {
		"type": "sap.ui.model.json.JSONModel",
		"settings": {},
		"uri": "./model/tuunt.json",
		"preload": true
	}, */
	var _engineModules; // holds a copy of the table TUAPP;
	var _custInfos; // lists units and the corresponding customer information sheets
	var _tuunttTexts; // holds a copy of the table TUUNTT
	var _tutypTexts; // holds a copy of the table TUTYP
	var _tul_acttc; // holds a copy of the table TUL_ACTTC
	var _cis_defaults; // holds the generic URL for the engine page & a title; 

	var _tuzus = {
		"00": "No special version",
		"01": "Double Byte",
		"02": "Arabic",
		"03": "Cyrillic",
		"04": "Greek",
		"90": "50% surcharge",
		"91": "100% surcharge"
	};
	// holds a copy of the table TUZUT (for country surcharge)

	// Constant values					
	var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var _RESULT_TYPES = {
		"PartId": 0,
		"USR": 1,
		"ENGS": 2,
		"ENGC": 3,
		"CHK": 4,
		"Unknown": 9
	}; // for each result type (except PartId) a new Panel element will be rendered
	// var _RESULT_TYPES_STR =		{ "PartId":"PartId",	"USR": "USR",	"ENGS": "ENGS",	"ENGC": "ENGC", "CHK": "CHK",	"Unknown": 9 };	// XML content to define ResultType
	// var _POS_RES_ARRAY =		{ "Controls": 0, "CodeStr": 1, "StartLine": 2, "BlockType" :3 };		// position of data elements in the array handed over from the buildResult to the renderResult methods
	var _POS_RES_VAL = {
		"GenId": 0,
		"GenId_F3": 1,
		"GenId_F4": 2,
		"GenId_L2": 3,
		"GenId_L4": 4,
		"At1": 5,
		"At2": 6,
		"Unit": 7,
		"PerStart": 8,
		"PerEnd": 9,
		"Counter": 10,
		"CisUrl": 11,
		"CisTitle": 12,
		"TuUntTitle": 13,
		"Unit_L4": 14
	}; // position of various contentText/innerHTML values of the current result
	var _CIS_DATA = {
		"URL": 0,
		"Title": 1
	}; // used to decide if the URL or the Title should be read from the custInfoSheets.json file  
	var _KNOWN_TAGS = {
		"Counter": "Counter",
		"GenericId": "GenericId",
		"Attributes1": "Attribute1",
		"Attributes2": "Attribute2",
		"Unit": "Unit",
		"PerStartEnd": "PerStart/PerEnd"
	}; // List of (case sensitive) tags used in the application and (potentially) used in the tagTranslation.json file
	var _TITLE_CSS = "results"; // style class for titles

	return BaseController.extend("sap.support.zglacelx.controller.Part", {

		onInit: function () {
			this._checkInitialModel();
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.route = this.oRouter.getRoute("part");
			this.oView = this.getView();

			this._oModel = this.getOwnerComponent().getModel("userXML");
			this.route.attachMatched(this._onRouteMatched, this);

			this.iPartsCount = this._oModel.getData().children[0]._tagMeasurementPartsHook.childElementCount;
			this.iSystemsCount = this._oModel.getData().children[0]._tagMeasurementSystemsHook.childElementCount;
		},

		showAllResults: function () {
			var resultPanel = this.oView.byId("resultList");
			resultPanel.setBusy(true);

			// register to resultList.onAfterRendering event to release busy indicatore when (time consuming) rendering is done
			resultPanel.onAfterRendering = function () {
				if (sap.ui.layout.VerticalLayout.prototype.onAfterRendering) {
					sap.ui.layout.VerticalLayout.prototype.onAfterRendering.apply(this);
				}
				resultPanel.setBusy(false);
			};

			var eventBus = sap.ui.getCore().getEventBus();
			eventBus.subscribe("ch1", "loadMore", this.loadMore, this);

			var moreButton = this.oView.byId("moreButton");
			moreButton.setVisible(false);

			var _timeout = jQuery.sap.delayedCall(1000, this, function () {
				eventBus.publish("ch1", "loadMore");
			});
		},

		loadMore: function () {
			// console.log("load more data called");				
			this._buildResultList(false);
			// console.log("load more data completed");
		},

		_onRouteMatched: function (oEvent) {
			// console.log("onRouteMatched");	
			// initialize variables	
			_i18nBundle = this.getView().getModel("i18n").getResourceBundle();
			_engineModules = this.getView().getModel("tuapp").getData().modules;
			_custInfos = this.getView().getModel("custInfos").getData().cis;
			_cis_defaults = this.getView().getModel("custInfos").getData().defaults;
			_tuunttTexts = this.getView().getModel("tu_untt").getData().unitsList;
			_tutypTexts = this.getView().getModel("tutyp").getData().types;
			_tul_acttc = this.getView().getModel("tul_acttc").getData().tnames;
			// _translatableTags = this.getView().getModel("tags").getData().tags; 
			// _translatableTexts = this.getView().getModel("trans").getData().trans;
			// _engineNames = this.getView().getModel("engineNames").getData().units;

			this.iPartsCount = this._oModel.getData().children[0]._tagMeasurementPartsHook.childElementCount;
			this.iSystemsCount = this._oModel.getData().children[0]._tagMeasurementSystemsHook.childElementCount;

			// render <Part>'s property block
			this.oView.setModel(this._oModel);
			this.oArgs = oEvent.getParameter("arguments");
			this._buildPartPropertiesUi(oEvent);

			// render <Result>'s property block
			var resultList = this.oView.byId("resultList");
			this._buildResultList(true);
		},

		/* Build the upper section with the <parts> properties */
		_buildPartPropertiesUi: function (oEvent) {
			this.sysIdx = this.oArgs.sysIndex;
			this.partIdx = this.oArgs.partIndex;
			// var resultIdx = this._getCorrespondingResultIndex(this.partIdx);

			this.systPath = "/Systems/System/" + this.sysIdx;

			// To enable the back button: bind system object to page so it is accessable when needed/the back button is pressed
			var oForm = this.oView.byId("resultPage");
			oForm.bindElement({
				path: this.systPath,
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

			// i18n - get resource bundle 	
			var iSysText = _i18nBundle.getText("model.systems.System.text");
			var iClientText = _i18nBundle.getText("part.page.client.text");

			// bind part properties	
			/* var oForm = this.oView.byId("selectedPart");
			oForm.bindElement( { 
				path: iPartsPath, 
				events : {
					change: this._onBindingChange.bind(this),
					dataRequested: function (oEvent) {
						this.oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						this.oView.setBusy(false);
					}
				}
			}); */

			var _propertiesArea = this.oView.byId("partProperties");

			// If there is a <Result> block corresponding to the part, render properties

			// Build title for Result page, e.g. "Results for System C31, Client 100"
			var sysLabel = "(unknown)";
			var partLabel = sysLabel;
			// get system label (SID or fallback: SystemNo)
			try {
				var _iSAP_SID = this._oModel.getProperty(this.systPath + "/SAP_SID");
			} catch (err) {
				var _iSAP_SID = this._translate("i18n>all.na"); // =n.a.
			}
			try {
				var _iSystemNo = this._oModel.getProperty(this.systPath + "/SystemNo");
			} catch (err) {
				var _iSystemNo = this._translate("i18n>all.na"); // =n.a.
			}
			var _oSys = this._oModel.getProperty(this.systPath);

			if (_oSys) {
				if (_iSAP_SID) {
					sysLabel = iSysText + " " + _iSAP_SID;
				} else if (_iSystemNo) {
					var sysNo = parseFloat(_iSystemNo);
					sysLabel = iSysText + " " + sysNo;
				} else {
					sysLabel = iSysText + " #" + this.sysIdx;
				}
			}

			// breadcrumb - update SID and client number
			if (_iSAP_SID != this._translate("i18n>all.na")) {
				this.oView.byId("bcSid").setText(_iSAP_SID);
			} else {
				this.oView.byId("bcSid").setText(_iSystemNo);
			}

			// get client number; use part index as a fall back if no client number exist		
			var iPartsPath = "/Parts/Part/" + this.partIdx;

			var _sSAP_CLIENT = this._oModel.getProperty(iPartsPath + "/SAP_CLIENT");
			var _sGenId = this._oModel.getProperty(iPartsPath + "/GenericId");

			var partClientText = formatter.formatClientRb(_sSAP_CLIENT, _sGenId, this.partIdx, _i18nBundle);
			var partClientName = this._oModel.getProperty(iPartsPath + "/Name");

			if (partClientName && partClientName !== "") {
				oForm.setTitle(partClientText + " / " + partClientName + " (" + sysLabel + ")");
			} else {
				oForm.setTitle(partClientText + " (" + sysLabel + ")");
			}

			var _mainModelRaw = this._oModel.getData().children[0];
			// navigate to part branch and extract data
			var _rawSystemData = _mainModelRaw._tagMeasurementPartsHook.children[this.partIdx];
			// set code editor context
			var _oSysCodeEditor = this.oView.byId("propertiesCE");
			_oSysCodeEditor.setMaxLines(100000000);
			// build editor context
			this.buildEditorContext(_rawSystemData, _oSysCodeEditor);

			// --- build properties list				
			_propertiesArea.destroyContent();
			this._writeAllPropertyLines(_propertiesArea, _rawSystemData);

			// --- disable "next" XML block for the last result
			var nextBlockBt = this.oView.byId("nextBlock");
			if (this._resultSelected) {
				var resIndx = Number.parseInt(this._resultSelected.substr("resultid/".length, this._resultSelected.length));
				if (resIndx < this._oModel.getData().children[0]._tagMeasurementResultsHook.childElementCount - 1) {
					nextBlockBt.setEnabled(true);
					nextBlockBt.setTooltip("");
				} else {
					nextBlockBt.setEnabled(false);
					nextBlockBt.setTooltip(this._translate("i18n>xml.button.bottom"));
				}
			} else {
				//if (this.partIdx < this._oModel.getData().children[0]._tagMeasurementPartsHook.childElementCount - 1) {					
				nextBlockBt.setTooltip("");
				nextBlockBt.setEnabled(true);
				/* } else {
					nextBlockBt.setTooltip(this._translate("i18n>xml.button.bottom"));
					nextBlockBt.setEnabled(false);
				} */
			}
			// console.log("Part index = " + this.partIdx + ", Part count = " +  this._oModel.getData().children[0]._tagMeasurementPartsHook.childElementCount);
		},

		_getTuuntText: function (engine, metric) {
			if (engine && engine.trim() !== "" && metric && metric.trim() !== "") {

				// reduce engine variable to number without leading 0s  
				engine = engine.trim().toUpperCase();
				if (engine.startsWith("ENG")) { // ENGC or ENGS
					engine = engine.substr(3, engine.length);
				}
				while (engine.startsWith("0")) {
					engine = engine.substr(1, engine.length);
				}
				// reduce metric variable to number without leading 0s
				metric = metric.trim().toUpperCase();
				if (metric.startsWith("UNT")) {
					metric = metric.substr(3, metric.length);
				}
				while (metric.startsWith("0")) {
					metric = metric.substr(1, metric.length);
				}

				var units, curEngine, curUnit;
				for (var i = 0; i < _tuunttTexts.length; i++) {
					curEngine = _tuunttTexts[i].engine;
					if (engine === curEngine || "" === curEngine) {
						units = _tuunttTexts[i].units;
						for (var j = 0; j < units.length; j++) {
							curUnit = _tuunttTexts[i].units[j].unit;
							if (curUnit === metric) {
								return metric + ": " + _tuunttTexts[i].units[j].unitName;
							}
						}
						// engine matched, but no corresponding metric entry. There won't be any further engine match, so return and use default text	
						// debugger;
						break;
					} 
				}
			}
			// No entry found, use default text	
			return this._formatTranslation(this._translate("i18n>result.metric.defaultTitle.txt"), // =License {0}
				metric);
		},

		_getTutypText: function (uType) {
			if (uType && uType.trim() !== "") {
				uType = uType.trim().toUpperCase();
				if (uType.startsWith("USRC")) {
					uType = uType.substr(4, uType.length);
				}
				while (uType.startsWith("0")) {
					uType = uType.substr(1, uType.length);
				}
				var unit;
				for (var i = 0; i < _tutypTexts.length; i++) {
					unit = _tutypTexts[i].type;

					while (unit && unit.startsWith("0")) {
						unit = unit.substr(1, unit.length);
					}

					if (unit === uType) {
						return _tutypTexts[i].uiTextLong;
					}
				}
			}
			// No entry found, use empty text
			return "";
		},

		_getTuappText: function (engId) {
			var engine = engId; // keep original with 0s
			if (engine && engine.trim() !== "") {
				while (engine.startsWith("0")) {
					engine = engine.substr(1, engine.length);
				}
			}

			var cur_applic;
			for (var i = 0; i < _engineModules.length; i++) {
				cur_applic = _engineModules[i].applic;
				if (engine === cur_applic) {
					if (_engineModules[i].name && _engineModules[i].name.trim() !== "") {
						if (_engineModules[i].func_mod && _engineModules[i].func_mod.trim() !== "") {
							return this._formatTranslation(this._translate("i18n>result.engine.specificTitleModule.txt"), engId, _engineModules[i].name,
								_engineModules[i].func_mod);
						} else {
							return this._formatTranslation(this._translate("i18n>result.engine.specificTitle.txt"), engId, _engineModules[i].name);
						}
					} else {
						break; // no name for the engine, so just show default (Engine ID) 
					}
				}
			}
			return this._formatTranslation(this._translate("i18n>result.engine.defaultTitle.txt"), engId);
		},

		_getTul_ActtcText: function (tableId) {
			if (tableId && tableId.trim() !== "") {
				for (var i = 0; i < _tul_acttc.length; i++) {
					if (tableId === _tul_acttc[i].id) {
						return _tul_acttc[i].table;
					}
				}
			}
			return "";
		},

		_getCustInfoSheetData: function (oMetric, retElement) {
			var cisData = ["", ""]; // define an empty result set with three entries, one for URL, one for the title, one for the covered units
			var metric = oMetric;

			if (!metric || metric.trim() === "") {
				return null;
			}
			metric = metric.trim().toUpperCase();
			if (metric.startsWith("UNT")) {
				metric = metric.substr(3, metric.length);
			}
			while (metric.startsWith("0")) {
				metric = metric.substr(1, metric.length);
			}
			while (metric.endsWith("-")) {
				metric = metric.substr(0, metric.length - 1);
			}
			var metrDef;

			// first loop, find direct matches only
			for (var i = 0; i < _custInfos.length; i++) {
				var metrics = _custInfos[i].units;
				for (var j = 0; j < metrics.length; j++) {
					metrDef = _custInfos[i].units[j];
					while (metrDef.startsWith("0")) {
						metrDef = metrDef.substr(1, metrDef.length - 1);
					}
					while (metrDef.endsWith("-")) {
						metrDef = metrDef.substr(0, metrDef.length - 1);
					}
					if (metric === metrDef) {
						cisData[_CIS_DATA.URL] = _custInfos[i].url;
						cisData[_CIS_DATA.Title] = _custInfos[i].title;
						return cisData;
					}
				}
			}

			// second loop, check if metric fit into a range of two unit ids; the first one is detected by a dash at the end 
			for (var i = 0; i < _custInfos.length; i++) {
				var metrics = _custInfos[i].units;
				try {
					var metricInt = parseInt(metric);
					for (var j = 0; j < metrics.length; j++) {
						if (_custInfos[i].units[j].endsWith("-") && j < metrics.length - 1) {
							var lowUnit = _custInfos[i].units[j];
							lowUnit = lowUnit.substr(0, lowUnit.length - 1);
							lowUnit = parseInt(lowUnit);
							var highUnit = parseInt(_custInfos[i].units[j + 1]);

							if (!isNaN(lowUnit) && !isNaN(highUnit) && !isNaN(metricInt) && lowUnit <= metricInt && metricInt <= highUnit) {
								cisData[_CIS_DATA.URL] = _custInfos[i].url;
								cisData[_CIS_DATA.Title] = _custInfos[i].title;
								return cisData;
							}
						}
					}
				} catch (err) {
					// one unit ID was not a number 
				}
			}

			// cisData[_CIS_DATA.URL] = "";
			cisData[_CIS_DATA.Title] = this._formatTranslation(
				this._translate("i18n>result.engine.defaultTitle.txt"), // =Engine {0}
				metric);
			return cisData;
		},

		_removeLeadingZeros: function (val) {
			while (val && val.length > 0 && val.substr(0, 1) === "0") {
				val = val.substr(1, val.length);
			}
			return val;
		},

		/* returns ENG (for engines), CHK (for usage checks), USR (for users) or UNK (for all other, unknown/unexpected types) */
		_getBlockType: function (tag) {
			if (tag && tag.length > 2) {
				var sub = tag.substring(0, 3).toUpperCase();
				if (sub === "ENG" || sub === "CHK" || sub === "USR") {
					return sub;
				}
			}
			return "UNK";
		},

		_getPanelText: function (type) {
			if ("CHK" === type) return this._translate("i18n>model.result.checks.CHK.text");
			if ("ENG" === type) return this._translate("i18n>model.result.checks.ENG.text");
			if ("USR" === type) return this._translate("i18n>model.result.checks.USR.text");
			return this._translate("i18n>model.result.checks.UNK.text");
		},

		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("resultPage").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("[Result page/Part.controller] System number can't be found");
			}
		},

		_writeAllPropertyLines: function (mainArea, _result) {
			mainArea.addContent(
				new ResultLine({
					label: this._translate("i18n>part.page.index.text"),
					tag: "",
					text: this.partIdx,
					skipTopMargin: false
				}));

			var resLine = 0;
			var labelUiText;

			if (_result && _result.childElementCount > 0) {
				while (resLine < _result.children.length) {
					var curResult = _result.children[resLine];
					if (curResult) {
						labelUiText = this._getTagTranslation(curResult.tagName, curResult.textContent);
						if (typeof labelUiText !== "string") {
							labelUiText = curResult.tagName;
						}
						labelUiText = this._translate(labelUiText);
						mainArea.addContent(
							new ResultLine({
								// title: labelUiText,
								label: labelUiText,
								tag: curResult.tagName,
								text: curResult.innerHTML,
								skipTopMargin: true
							}));
					}
					resLine++;
				}
			} else {
				mainArea.removeAllContent();
				mainArea.addContent(
					new Label({
						text: this._translate("i18n>model.result.noData.text")
					})
				);
			}
		},

		// var _POS_RES_VAL = { "GenId": 0, "GenId_F3": 1, "GenId_3": 2, "At1": 3, "At2": 4, "Unit": 5, "PerStart": 6, "PerEnd": 7, "Counter": 8 }; 	// position of various contentText/innerHTML values of the current result 
		/* Loop over the result node and fill an array that holds the values (contentText) of the tags GenericId, Attribute 1/2, Unit, PerStart, PerEnd and Counter. 
		These are used particluarly for later checks. */
		_getResultValueArray: function (curResult) {

			var resVal = new Array(_POS_RES_VAL.length);
			if (!curResult) return resVal;

			var childLine = 0;
			var curResChild, curResChildTxt, monthTxt;
			while (childLine < curResult.childElementCount) {
				curResChild = curResult.children[childLine];
				if (curResChild.tagName && curResChild.textContent) {
					curResChildTxt = curResChild.textContent.trim().toUpperCase();
					switch (curResChild.tagName.trim().toUpperCase()) {
					case "GENERICID":
						resVal[_POS_RES_VAL.GenId] = curResChildTxt;
						if (curResChildTxt.length > 3) {
							resVal[_POS_RES_VAL.GenId_F3] = curResChildTxt.substr(0, 3);
							resVal[_POS_RES_VAL.GenId_F4] = curResChildTxt.substr(0, 4);
						}
						if (curResChildTxt.length > 13) {
							resVal[_POS_RES_VAL.GenId_L2] = curResChildTxt.substr(12, 2);
							resVal[_POS_RES_VAL.GenId_L4] = curResChildTxt.substr(10, 4);
						}
						break;
					case "ATTRIBUTE1":
						resVal[_POS_RES_VAL.At1] = curResChildTxt;
						break;
					case "ATTRIBUTE2":
						resVal[_POS_RES_VAL.At2] = curResChildTxt;
						break;
					case "UNIT": // get UNIT and (if available) the URL of the customer information sheet via custInfoSheets.json
						resVal[_POS_RES_VAL.Unit] = curResChildTxt;
						if (curResChildTxt.length >= 4) {
							resVal[_POS_RES_VAL.Unit_L4] = curResChildTxt.substr(curResChildTxt.length - 4, 4);
						} else {
							resVal[_POS_RES_VAL.Unit_L4] = null;
						}
						break;
					case "PERSTART":
						if (curResChildTxt.length === 8) {
							monthTxt = curResChildTxt.substr(4, 2);
							try {
								monthTxt = MONTHS[Number(monthTxt) - 1];
							} catch (err) {
								// not a valid number, keep number instread of txt 
							}
							resVal[_POS_RES_VAL.PerStart] = curResChildTxt.substr(6, 2) + " " + monthTxt + ", " + curResChildTxt.substr(0, 4);
						} else {
							resVal[_POS_RES_VAL.PerStart] = curResChildTxt;
						}
						break;
					case "PEREND":
						if (curResChildTxt.length === 8) {
							monthTxt = curResChildTxt.substr(4, 2);
							try {
								monthTxt = MONTHS[Number(monthTxt) - 1];
							} catch (err) {
								// not a valid number, keep number instread of txt 
							}
							resVal[_POS_RES_VAL.PerEnd] = curResChildTxt.substr(6, 2) + " " + monthTxt + ", " + curResChildTxt.substr(0, 4);
						} else {
							resVal[_POS_RES_VAL.PerEnd] = curResChildTxt;
						}
						break;
					case "COUNTER":
						resVal[_POS_RES_VAL.Counter] = curResChildTxt;
						break;
					}
				}
				childLine++;
			}

			if (resVal[_POS_RES_VAL.GenId_F3] === "ENG") {
				var cisData = this._getCustInfoSheetData(resVal[_POS_RES_VAL.GenId_L4]);
				resVal[_POS_RES_VAL.CisUrl] = cisData[_CIS_DATA.URL];
				resVal[_POS_RES_VAL.CisTitle] = cisData[_CIS_DATA.Title];

			} else {
				resVal[_POS_RES_VAL.CisUrl] = "";
				resVal[_POS_RES_VAL.CisTitle] = "";
			}
			resVal[_POS_RES_VAL.TuUntTitle] = this._getTuuntText(resVal[_POS_RES_VAL.GenId_L4], resVal[_POS_RES_VAL.Unit]);

			return resVal;
		},

		_buildResultList: function (isFirstBlock) {
			// console.log("Called buildResultList, isFirstBock=" + isFirstBlock);
			// console.trace();			
			var resultIdx = this._getCorrespondingResultIndex(this.partIdx);

			// drop down selector
			var ddList = this.oView.byId("drop");
			ddList = this._getCodeSelector(ddList, "part/" + this.partIdx, "resultid/" + resultIdx);

			// navigate to part branch and extract data
			var _mainModelRaw = this._oModel.getData().children[0];
			var _result = _mainModelRaw._tagMeasurementResultsHook.children[resultIdx];
			var isLastResult = (resultIdx + 1 === _mainModelRaw._tagMeasurementResultsHook.childElementCount);

			// no result block available for this part
			if (!_result) {
				this._renderResultList(null);
				return;
			}

			var resElem = 0;
			var codeLine = _result._tagLineStart; // holds a line counter for the last processed code line 
			var resBlockStartLine = codeLine; // holds the line number which is used for the first line of the current result block
			// array elements: [0] displayedElement, [1] codeStr, [2] head line

			var resultArray = new Array(); // holds the arrays for all result blocks. 
			var resultElement; // holds one array of one result block. 

			var displayedElements = new Array(); // holds all Controls to be displayed of a result block
			var codeStr = "\t\t<" + _result.tagName + ">\n"; // holds all tag lines for the code editor of a result block; new lines with \n
			codeLine++;

			// var for the loop 
			var curResult, // holds the current <Result> node
				curResChild, // holds child nodes of the <Result> node
				// curResChildTxt,	// holds the text content of the curResChild (trimmed, upper case)
				resType, // holds the ResultType of the current result block
				curResVal, prevResVal, nextResVal, // three arrays that hold various the tag values of the current / previous / next result
				childLine, // iterator variable for child elements
				displayTxt, // text shown in a result line;
				hasMore, // does the next result block also belong to this result block;
				hadMore, // did the previous item had more items belonging to the same result block;
				// hasTemplate, 	// flag: Most templates render the result in a specific way (hasTemplate = true);
				//  there might be cases where no template appies and a default rendering of the result blockend should take place (hasTemplate = false)
				title, // temporary variable to hold a title element which needs additional style class
				mlogStack, // array that holds entries/lines of MLOG entries which is an array of [0] Attr1, [1] curResVal, //// no longer: [2] codeStr, [3] codeLine
				mlpkStack, // array that holds entries/lines of MLPK entries which is an array of [0] Attr1, [1] curResVal, //// no longer: [2] codeStr, [3] codeLine
				curMlStackLine, // temporary var to create/read a stack line for MLOG/MLPK
				oHBox, // temporary HBox item to have multi segment headline
				oControl, // temporary Control
				helpText // text of the (optional) help text paragraph after the last tag
			;

			prevResVal = this._getResultValueArray(null); // initialize empty 

			// loop over the child nodes of the <part> element (typically one <PartId> and multiple <Result> nodes, of which some belong together)
			while (resElem < _result.children.length) {
				curResult = _result.children[resElem];
				// hasTemplate = true; // default setting

				// write code lines into codeStr variable for XML editor				
				if (curResult.childElementCount > 0) {
					codeLine = codeLine + 2 + curResult.childElementCount;
					codeStr = codeStr + "\t\t\t<" + curResult.tagName + ">\n";
					for (var i = 0; i < curResult.childElementCount; i++) {
						codeStr = codeStr + "\t\t\t\t" + curResult.children[i].outerHTML + "\n";
					}
					codeStr = codeStr + "\t\t\t</" + curResult.tagName + ">";
				} else {
					codeLine = codeLine + 1;
					codeStr = codeStr + "\t\t\t" + curResult.outerHTML + "";
				}

				if (curResult.childElementCount == 0) {
					// handle <PartId>1</PartId>
					resType = _RESULT_TYPES.PartId;

					title = new Label({
						text: this._translate("i18n>model.parts.part.partId.text"),
						design: sap.m.LabelDesign.Bold,
						wrapping: true
					});
					// title.addStyleClass(_TITLE_CSS);
					title.addStyleClass("sapUiTinyMarginTop");
					displayedElements.push(title);

					displayedElements.push(
						new ResultLine({
							label: this._translate("i18n>model.parts.part.partId.text"),
							tag: curResult.nodeName,
							text: curResult.innerHTML,
							skipTopMargin: true
						}));
					resultElement = new Array(displayedElements, codeStr, resBlockStartLine, resType);
					resultArray.push(resultElement);

					// reset 
					codeStr = "";
					displayedElements = new Array();
					resBlockStartLine = codeLine;
				} else {
					// get next two results
					curResVal = this._getResultValueArray(curResult);
					if (resElem + 1 < _result.childElementCount) {
						nextResVal = this._getResultValueArray(_result.children[resElem + 1]); //  _result.children[resElem + 1] may be null
					} else {
						nextResVal = this._getResultValueArray(null);
					}

					// handle various special cases, otherwise default case
					// is it a User Type block?					
					if ("USRC" === curResVal[_POS_RES_VAL.GenId_F4] || "USRS" === curResVal[_POS_RES_VAL.GenId_F4]) {
						hadMore = hasMore;
						// is there a next item?
						hasMore = (curResVal[_POS_RES_VAL.GenId_F4] === nextResVal[_POS_RES_VAL.GenId_F4] && curResVal[_POS_RES_VAL.At2] === nextResVal[
							_POS_RES_VAL.At2]);

						// render a general intro line with a link to user classification
						if ("USRC" !== prevResVal[_POS_RES_VAL.GenId_F4] && "USRS" !== prevResVal[_POS_RES_VAL.GenId_F4]) {
							title = new Link({
								text: this._translate("i18n>result.cis.user.text"),
								target: "_blank",
								href: _cis_defaults.userPage
							});
							title.addStyleClass(_TITLE_CSS);
							title.addStyleClass("sapUiTinyMarginTop");
							displayedElements.push(title);
						}

						// If this result block doesn't belong to the previous user block (link via Attribute 2), render the introduction lines  
						if (("USRC" === curResVal[_POS_RES_VAL.GenId_F4] &&
								("USRC" !== prevResVal[_POS_RES_VAL.GenId_F4] || curResVal[_POS_RES_VAL.At2] !== prevResVal[_POS_RES_VAL.At2])
							) ||
							("USRS" === curResVal[_POS_RES_VAL.GenId_F4])
						) {
							displayTxt = this._getTagTranslation(_KNOWN_TAGS.Counter, null,
								(hasMore && "USRS" !== curResVal[_POS_RES_VAL.GenId_F4]),
								this._removeLeadingZeros(curResVal[_POS_RES_VAL.Counter]),
								curResVal[_POS_RES_VAL.GenId_F4]);
							displayedElements.push(
								new ResultLine({
									title: displayTxt,
									tag: _KNOWN_TAGS.Counter,
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: false,
									styleSuffix: "2"
								}) // actually false, but there is line space anyway, so drop it
							);
						}

						// in any way, render classification Type 
						// function (tag, innerHtml, getMulti, firstTagHtml, secNum)
						displayTxt = this._getTagTranslation(_KNOWN_TAGS.GenericId, curResVal[_POS_RES_VAL.GenId], hasMore, curResVal[_POS_RES_VAL.Counter],
							null);
						var translt = this._getTutypText(curResVal[_POS_RES_VAL.GenId_L2]);

						displayedElements.push(
							new ResultLine({
								label: displayTxt + ": " + translt,
								tag: _KNOWN_TAGS.GenericId,
								text: curResVal[_POS_RES_VAL.GenId],
								skipTopMargin: true,
								styleSuffix: "3"
							})
						);

						// render country surcharge (should only occur for USRS)
						/// var _tuzus =	{ "00": "No special version", "01": "Double Byte", "02": "Arabic", "03": "Cyrillic", "04": "Greek", "90": "50% surcharge", "91": "100% surcharge" };
						if (curResVal[_POS_RES_VAL.Unit] && curResVal[_POS_RES_VAL.Unit].trim() !== "") {
							if ("SURL" === curResVal[_POS_RES_VAL.Unit]) {
								displayTxt = this._translate("i18n>result.usrs.surl.txt");
							} else {
								displayTxt = this._translate("i18n>result.usrs.surs.txt");
							}
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Unit,
									text: curResVal[_POS_RES_VAL.Unit],
									skipTopMargin: true,
									styleSuffix: "3"
								})
							);

							// render surcharge value
							if (curResVal[_POS_RES_VAL.At1] && curResVal[_POS_RES_VAL.At1].trim() !== "") {
								displayTxt = null;
								if ("SURS" === curResVal[_POS_RES_VAL.Unit]) {
									displayTxt = _tuzus[curResVal[_POS_RES_VAL.At1]];
								}
								if (displayTxt == null) {
									displayTxt = this._formatTranslation(
										this._translate("i18n>result.usrs.surl.perc.txt"),
										curResVal[_POS_RES_VAL.At1]
									);
								}
								displayedElements.push(
									new ResultLine({
										label: displayTxt,
										tag: _KNOWN_TAGS.Attributes1,
										text: curResVal[_POS_RES_VAL.At1],
										skipTopMargin: true,
										styleSuffix: "3"
									})
								);
							}
						}

						if (hasMore) {
							prevResVal = curResVal;
							codeStr = codeStr + "\n";
						} else {
							// If the next result block doesn't belong to this result block, render the closding lines for USRC cases, not for USRS cases
							if ("USRC" === curResVal[_POS_RES_VAL.GenId_F4]) {
								displayTxt = this._getTagTranslation(_KNOWN_TAGS.Attributes2, null, false, curResVal[_POS_RES_VAL.At2], curResVal[_POS_RES_VAL
									.GenId_F4]);
								displayedElements.push(
									new ResultLine({
										label: displayTxt,
										tag: _KNOWN_TAGS.Attributes2,
										text: curResVal[_POS_RES_VAL.At2],
										skipTopMargin: true
									})
								);
							}
							if (hadMore && "USRC" === curResVal[_POS_RES_VAL.GenId_F4]) {
								// render comment	
								title = new ClearLine({
									style: "elxCL1"
								});
								displayedElements.push(title);
								title = new Label({
									text: this._translate("i18n>result.USRC.comment.text"),
									wrapping: true
								});
								title.addStyleClass("elxSrlSpanL3");
								displayedElements.push(title);
							}

							// end result block handling
							resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
							resultArray.push(resultElement);
							// reset 
							codeStr = "";
							displayedElements = new Array();
							resBlockStartLine = codeLine;
							prevResVal = curResVal;
						}
					} else if ("USRI" === curResVal[_POS_RES_VAL.GenId_F4]) {
						// is there a next item belonging to this rule?
						hasMore = ("USRI" === nextResVal[_POS_RES_VAL.GenId_F4] && curResVal[_POS_RES_VAL.GenId_L2] === nextResVal[_POS_RES_VAL.GenId_L2]);

						// render a general intro line with a link to user classification
						if ("USRI" !== prevResVal[_POS_RES_VAL.GenId_F4]) {
							title = new Link({
								text: this._translate("i18n>result.cis.user.text"),
								target: "_blank",
								href: _cis_defaults.userPage
							});
							title.addStyleClass(_TITLE_CSS);
							title.addStyleClass("sapUiTinyMarginTop");

							oControl = new Label({
								text: this._translate("i18n>result.cis.user.desc")
							}); // 
							oControl.addStyleClass("sapUiTinyMarginTop");

							oHBox = new sap.m.HBox();
							oHBox.addStyleClass("sapUiNoMargin");
							oHBox.addItem(title);
							oHBox.addItem(oControl);
							displayedElements.push(oHBox);

							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							displayTxt = this._translate("i18n>result.usri.txt");
							title = new Label({
								text: displayTxt,
								design: sap.m.LabelDesign.Bold,
								wrapping: true
							});
							displayedElements.push(title);
						}

						// If this result block doesn't belong to the previous user block (same value for GenericId (particluarly last two digits)), render the introduction lines  
						if (curResVal[_POS_RES_VAL.GenId_L2] !== prevResVal[_POS_RES_VAL.GenId_L2]) {
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.usri.includes.txt"),
								curResVal[_POS_RES_VAL.GenId_L2],
								this._getTutypText(curResVal[_POS_RES_VAL.GenId_L2])
							);
							displayedElements.push(
								new ResultLine({
									title: displayTxt,
									tag: _KNOWN_TAGS.GenericId,
									text: curResVal[_POS_RES_VAL.GenId],
									skipTopMargin: false,
									styleSuffix: "2"
								}) // actually false, but there is line space anyway, so drop it
							);
						}

						// in any way, render which user type was included						
						displayTxt = curResVal[_POS_RES_VAL.At1] + ": " + this._getTutypText(curResVal[_POS_RES_VAL.At1]);
						displayedElements.push(
							new ResultLine({
								label: displayTxt,
								tag: _KNOWN_TAGS.Attributes1,
								text: curResVal[_POS_RES_VAL.At1],
								skipTopMargin: true,
								styleSuffix: "3"
							})
						);

						prevResVal = curResVal;
						if (hasMore) {
							codeStr = codeStr + "\n";
						} else {
							// end result block handling
							resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
							resultArray.push(resultElement);
							// reset 
							codeStr = "";
							displayedElements = new Array();
							resBlockStartLine = codeLine;
						}
					} else if ("USRN" === curResVal[_POS_RES_VAL.GenId_F4]) {
						hasMore = ("USRN" === nextResVal[_POS_RES_VAL.GenId_F4]);

						// render a general intro line on special user type/names
						if ("USRN" !== prevResVal[_POS_RES_VAL.GenId_F4]) {
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							displayTxt = this._translate("i18n>result.usrn.txt");
							title = new Label({
								text: displayTxt,
								design: sap.m.LabelDesign.Bold
							});
							displayedElements.push(title);
						}

						displayTxt = this._formatTranslation(
							this._translate("i18n>result.usrn.id"),
							curResVal[_POS_RES_VAL.GenId_L2]
						);
						displayedElements.push(
							new ResultLine({
								label: displayTxt,
								tag: _KNOWN_TAGS.GenericId,
								text: curResVal[_POS_RES_VAL.GenId],
								skipTopMargin: false,
								styleSuffix: "3"
							})
						);

						displayTxt = this._formatTranslation(
							this._translate("i18n>result.usrn.name"),
							curResVal[_POS_RES_VAL.GenId_L2],
							curResVal[_POS_RES_VAL.At2]
						);
						displayedElements.push(
							new ResultLine({
								label: displayTxt,
								tag: _KNOWN_TAGS.At2,
								text: curResVal[_POS_RES_VAL.At2],
								skipTopMargin: true,
								styleSuffix: "3"
							})
						);

						prevResVal = curResVal;
						if (hasMore) {
							codeStr = codeStr + "\n";
						} else {
							// end result block handling
							resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
							resultArray.push(resultElement);
							// reset 
							codeStr = "";
							displayedElements = new Array();
							resBlockStartLine = codeLine;
						}
					} else if ("ENGC" === curResVal[_POS_RES_VAL.GenId_F4]) {
						// is there a next item?
						hasMore = false;
						if (curResVal[_POS_RES_VAL.CisUrl] && curResVal[_POS_RES_VAL.CisUrl] !== "") {
							hasMore = (curResVal[_POS_RES_VAL.CisUrl] === nextResVal[_POS_RES_VAL.CisUrl]);
						} else {
							hasMore = (curResVal[_POS_RES_VAL.GenId_L4] === nextResVal[_POS_RES_VAL.GenId_L4]);
						}

						// Do we have results for a metric with a different Customer information sheet --> Render title + URL als Link
						if ((!curResVal[_POS_RES_VAL.CisUrl] || curResVal[_POS_RES_VAL.CisUrl] === "") &&
							curResVal[_POS_RES_VAL.GenId_L4] !== prevResVal[_POS_RES_VAL.GenId_L4]) {

							oControl = new Label({
								text: this._translate("i18n>result.cis.engine.noCis.label.text")
							}); // =No specific customer information sheet - 
							oControl.addStyleClass("sapUiTinyMarginTop");

							oHBox = new sap.m.HBox();
							oHBox.addStyleClass("sapUiNoMargin ");
							oHBox.addItem(oControl);

							title = new Link({
								text: this._translate("i18n>result.cis.engine.noCis.link.text"), // =SAP Support Portal may list a recently published one
								target: "_blank",
								wrapping: true,
								href: _cis_defaults.enginePage
							});
							title.addStyleClass(_TITLE_CSS);
							title.addStyleClass("sapUiTinyMarginTop");
							oHBox.addItem(title);
							displayedElements.push(oHBox);

						} else if ((curResVal[_POS_RES_VAL.CisUrl] !== prevResVal[_POS_RES_VAL.CisUrl])) {
							title = new Link({
								text: curResVal[_POS_RES_VAL.CisTitle],
								target: "_blank",
								href: curResVal[_POS_RES_VAL.CisUrl]
							});
							title.addStyleClass(_TITLE_CSS);
							title.addStyleClass("sapUiTinyMarginTop");
							displayedElements.push(title);
						}

						// Do we have a new ENGC .... XXXX block? If so, render a headline with the engine number
						if (curResVal[_POS_RES_VAL.GenId] !== prevResVal[_POS_RES_VAL.GenId]) {
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							displayTxt = this._formatTranslation(
								this._getTuappText(curResVal[_POS_RES_VAL.GenId_L4]),
								curResVal[_POS_RES_VAL.GenId_L4]);
							title = new Label({
								text: displayTxt,
								design: sap.m.LabelDesign.Bold,
								wrapping: true
							});
							displayedElements.push(title);
						}

						// Do we have a different metric? --> render title from TUUNT table
						if (curResVal[_POS_RES_VAL.Unit] !== prevResVal[_POS_RES_VAL.Unit]) {
							title = new ClearLine({
								style: "elxCL2"
							});
							displayedElements.push(title);

							displayTxt = this._getTuuntText(curResVal[_POS_RES_VAL.GenId_L4], curResVal[_POS_RES_VAL.Unit]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Unit,
									text: curResVal[_POS_RES_VAL.Unit],
									skipTopMargin: true,
									styleSuffix: "2"

								}) // actually false, but there is line space anyway, so drop it
							);

							/* title = new Title ({ text: displayTxt, level: "H4" });
							title.addStyleClass(_TITLE_CSS);
							// title.addStyleClass("sapUiTinyMarginTop");
							displayedElements.push(title); */
						}

						if ((curResVal[_POS_RES_VAL.PerStart] && curResVal[_POS_RES_VAL.PerStart].trim() !== "") ||
							(curResVal[_POS_RES_VAL.PerEnd] && curResVal[_POS_RES_VAL.PerEnd].trim() !== "")) {
							displayTxt = this._formatTranslation(this._translate("i18n>model.result.col.Period.text"), // =From {0} to {1}:
								curResVal[_POS_RES_VAL.PerStart], curResVal[_POS_RES_VAL.PerEnd]);
						} else {
							displayTxt = this._translate("i18n>model.result.col.Count.text");
						}

						displayedElements.push(
							new ResultLine({
								label: displayTxt,
								tag: _KNOWN_TAGS.Counter,
								text: curResVal[_POS_RES_VAL.Counter],
								skipTopMargin: true,
								styleSuffix: "3"
							}) // actually false, but there is line space anyway, so drop it
						);

						if (!hasMore) {
							// end result block handling
							resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
							resultArray.push(resultElement);
							// reset 
							codeStr = "";
							displayedElements = new Array();
							resBlockStartLine = codeLine;
						} else {
							codeStr = codeStr + "\n";
						}
						prevResVal = curResVal;

					} else if ("ENGS" === curResVal[_POS_RES_VAL.GenId_F4]) {
						// is there a next item?
						hasMore = false;
						if (curResVal[_POS_RES_VAL.CisUrl] && curResVal[_POS_RES_VAL.CisUrl] !== "") {
							hasMore = (curResVal[_POS_RES_VAL.CisUrl] === nextResVal[_POS_RES_VAL.CisUrl]);
						} else {
							hasMore = (curResVal[_POS_RES_VAL.GenId_L4] === nextResVal[_POS_RES_VAL.GenId_L4]);
						}

						// Do we have results for a metric with a different Customer information sheet --> Render title + URL als Link
						if ((!curResVal[_POS_RES_VAL.CisUrl] || curResVal[_POS_RES_VAL.CisUrl] === "") &&
							curResVal[_POS_RES_VAL.GenId_L4] !== prevResVal[_POS_RES_VAL.GenId_L4]) {
							/* title = new Link ({ text: _cis_defaults.engineText, 
														target: "_blank", 
														href: _cis_defaults.enginePage	});
							title.addStyleClass(_TITLE_CSS);							
							title.addStyleClass("sapUiTinyMarginTop");
							displayedElements.push(title);	*/
						} else if ((curResVal[_POS_RES_VAL.CisUrl] !== prevResVal[_POS_RES_VAL.CisUrl])) {
							title = new Link({
								text: curResVal[_POS_RES_VAL.CisTitle],
								target: "_blank",
								wrapping: true,
								width: "90%",
								href: curResVal[_POS_RES_VAL.CisUrl]
							});
							title.addStyleClass(_TITLE_CSS);
							title.addStyleClass("sapUiTinyMarginTop");
							displayedElements.push(title);
						}

						// Do we have a new ENGS .... XXXX block? If so, render a headline with the engine number
						if (curResVal[_POS_RES_VAL.GenId] !== prevResVal[_POS_RES_VAL.GenId]) {
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							displayTxt = this._formatTranslation(
								this._getTuappText(curResVal[_POS_RES_VAL.GenId_L4]),
								curResVal[_POS_RES_VAL.GenId_L4]);
							title = new Label({
								text: displayTxt,
								design: sap.m.LabelDesign.Bold,
								wrapping: true
							});
							displayedElements.push(title);
						}

						// Do we have a different metric? --> render title from TUUNT table
						if (curResVal[_POS_RES_VAL.Unit] !== prevResVal[_POS_RES_VAL.Unit]) {
							title = new ClearLine({
								style: "elxCL2"
							});
							displayedElements.push(title);

							displayTxt = this._getTuuntText(curResVal[_POS_RES_VAL.GenId_L4], curResVal[_POS_RES_VAL.Unit]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Unit,
									text: curResVal[_POS_RES_VAL.Unit],
									skipTopMargin: true,
									styleSuffix: "2"

								}) // actually false, but there is line space anyway, so drop it
							);
						}

						// Render Attribut1 (Status) value	
						if (curResVal[_POS_RES_VAL.At1] && curResVal[_POS_RES_VAL.At1] !== "") {
							displayTxt = this._translate("i18n>model.result.col.Attr1.ENGS.text");
							displayTxt = this._formatTranslation(displayTxt, curResVal[_POS_RES_VAL.At1]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Attributes1,
									text: curResVal[_POS_RES_VAL.At1],
									skipTopMargin: true,
									styleSuffix: "3"
								}) // actually false, but there is line space anyway, so drop it
							);
						}

						// Render Attribut2 (Batch runtime in sec. ) value
						if (curResVal[_POS_RES_VAL.At2] && curResVal[_POS_RES_VAL.At2] !== "") {
							displayTxt = this._translate("i18n>model.result.col.Attr2.ENGS.text");
							displayTxt = this._formatTranslation(displayTxt, curResVal[_POS_RES_VAL.At2]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Attributes2,
									text: curResVal[_POS_RES_VAL.At2],
									skipTopMargin: true,
									styleSuffix: "3"
								}) // actually false, but there is line space anyway, so drop it
							);
						}

						// Render Counter value
						displayTxt = this._translate("i18n>model.result.col.Count.ENGS.text"); // (obsolete)
						displayedElements.push(
							new ResultLine({
								label: displayTxt,
								tag: _KNOWN_TAGS.Counter,
								text: curResVal[_POS_RES_VAL.Counter],
								skipTopMargin: true,
								styleSuffix: "3"
							}) // actually false, but there is line space anyway, so drop it
						);

						if (!hasMore) {
							// end result block handling
							resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
							resultArray.push(resultElement);
							// reset 
							codeStr = "";
							displayedElements = new Array();
							resBlockStartLine = codeLine;
						} else {
							codeStr = codeStr + "\n";
						}
						prevResVal = curResVal;

					} else if ("CHKP" === curResVal[_POS_RES_VAL.GenId_F4]) {
						/* var _POS_RES_VAL =			{ 	"GenId": 0, "GenId_F3": 1, "GenId_F4": 2, "GenId_L2": 3, "GenId_L4": 4, "At1": 5, "At2": 6, "Unit": 7, 
															"PerStart": 8, "PerEnd": 9, "Counter": 10, "CisUrl": 11, "CisTitle": 12, "TuUntTitle": 13 }; 	// position of various contentText/innerHTML values of the current result */

						if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000DELU") {
							// render blank line 
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							// render headline 							
							displayTxt = this._translate("i18n>result.chkp.DELU.headline"); // =Indicator: Users deleted before the measurement
							title = new Label({
								text: displayTxt,
								design: sap.m.LabelDesign.Bold,
								wrapping: true
							});
							displayedElements.push(title);

							// render tag & value
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chkp.DELU.Counter.desc"), //{0} user master records were deleted
								curResVal[_POS_RES_VAL.Counter]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Counter,
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: true,
									styleSuffix: "2"
								})
							);

							if (curResVal[_POS_RES_VAL.Unit]) {
								displayTxt = null;
								if (curResVal[_POS_RES_VAL.Unit] === "PERW000012") {
									displayTxt = this._translate("i18n>result.chkp.DELU.Unit.period_12.txt");
								} else if (curResVal[_POS_RES_VAL.Unit] === "PERW000004") {
									displayTxt = this._translate("i18n>result.chkp.DELU.Unit.period_4.txt");
								} else if (curResVal[_POS_RES_VAL.Unit] === "PERW000001") {
									displayTxt = this._translate("i18n>result.chkp.DELU.Unit.period_1.txt");
								}
								if (displayTxt) {
									displayedElements.push(
										new ResultLine({
											label: displayTxt,
											tag: _KNOWN_TAGS.Unit,
											text: curResVal[_POS_RES_VAL.Unit],
											skipTopMargin: true,
											styleSuffix: "3"
										})
									);
								}
							}

							// render from - to 
							if ((curResVal[_POS_RES_VAL.PerStart] && curResVal[_POS_RES_VAL.PerStart] !== "") ||
								(curResVal[_POS_RES_VAL.PerEnd] && curResVal[_POS_RES_VAL.PerEnd] !== "")) {
								displayTxt = this._formatTranslation(
									this._translate("i18n>result.chkc.PeriodS.text"), // =From {0} to {1}
									curResVal[_POS_RES_VAL.PerStart],
									curResVal[_POS_RES_VAL.PerEnd]);
								displayedElements.push(
									new ResultLine({
										label: displayTxt,
										tag: _KNOWN_TAGS.PerStartEnd,
										text: this._translate("i18n>all.3dots"), // ...
										skipTopMargin: true,
										styleSuffix: "3"
									})
								);
							}

						} else if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000EXPU") {
							hasMore = (nextResVal[_POS_RES_VAL.GenId] === "CHKP000000EXPU");
							// render blank line 
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							// render headline 			
							if (prevResVal[_POS_RES_VAL.GenId] !== "CHKP000000EXPU") {
								displayTxt = this._translate("i18n>result.chkp.EXPU.headline"); // 
								title = new Label({
									text: displayTxt,
									design: sap.m.LabelDesign.Bold,
									wrapping: true
								});
								displayedElements.push(title);
							}

							// render tag & value
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chkp.EXPU.Counter.desc"), //
								curResVal[_POS_RES_VAL.Counter]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Counter,
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: true,
									styleSuffix: "2"
								})
							);

							if (curResVal[_POS_RES_VAL.Unit]) {
								displayTxt = null;
								if (curResVal[_POS_RES_VAL.Unit] === "PERW000012") {
									displayTxt = this._translate("i18n>result.chkp.DELU.Unit.period_12.txt");
								} else if (curResVal[_POS_RES_VAL.Unit] === "PERW000004") {
									displayTxt = this._translate("i18n>result.chkp.DELU.Unit.period_4.txt");
								} else if (curResVal[_POS_RES_VAL.Unit] === "PERW000001") {
									displayTxt = this._translate("i18n>result.chkp.DELU.Unit.period_1.txt");
								}
								if (displayTxt) {
									displayedElements.push(
										new ResultLine({
											label: displayTxt,
											tag: _KNOWN_TAGS.Unit,
											text: curResVal[_POS_RES_VAL.Unit],
											skipTopMargin: true,
											styleSuffix: "3"
										})
									);
								}
							}

							// render from - to 
							if ((curResVal[_POS_RES_VAL.PerStart] && curResVal[_POS_RES_VAL.PerStart] !== "") ||
								(curResVal[_POS_RES_VAL.PerEnd] && curResVal[_POS_RES_VAL.PerEnd] !== "")) {
								displayTxt = this._formatTranslation(
									this._translate("i18n>result.chkc.PeriodS.text"), // =From {0} to {1}
									curResVal[_POS_RES_VAL.PerStart],
									curResVal[_POS_RES_VAL.PerEnd]);
								displayedElements.push(
									new ResultLine({
										label: displayTxt,
										tag: _KNOWN_TAGS.PerStartEnd,
										text: this._translate("i18n>all.3dots"), // ...
										skipTopMargin: true,
										styleSuffix: "3"
									})
								);
							}
						} else if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000FUTU") {
							hasMore = (nextResVal[_POS_RES_VAL.GenId] === "CHKP000000FUTU");
							// render blank line 
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							// render headline 			
							if (prevResVal[_POS_RES_VAL.GenId] !== "CHKP000000FUTU") {
								displayTxt = this._translate("i18n>result.chkp.FUTU.headline"); // 
								title = new Label({
									text: displayTxt,
									design: sap.m.LabelDesign.Bold,
									wrapping: true
								});
								displayedElements.push(title);
							}

							// render tag & value
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chkp.FUTU.Counter.desc"), //
								curResVal[_POS_RES_VAL.Counter]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Counter,
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: true,
									styleSuffix: "2"
								})
							);

							if (curResVal[_POS_RES_VAL.Unit]) {
								displayTxt = null;
								if (curResVal[_POS_RES_VAL.Unit] === "PERW000012") {
									displayTxt = this._translate("i18n>result.chkp.FUTU.Unit.period_12.txt");
								} else if (curResVal[_POS_RES_VAL.Unit] === "PERW000004") {
									displayTxt = this._translate("i18n>result.chkp.FUTU.Unit.period_4.txt");
								} else if (curResVal[_POS_RES_VAL.Unit] === "PERW000001") {
									displayTxt = this._translate("i18n>result.chkp.FUTU.Unit.period_1.txt");
								}
								if (displayTxt) {
									displayedElements.push(
										new ResultLine({
											label: displayTxt,
											tag: _KNOWN_TAGS.Unit,
											text: curResVal[_POS_RES_VAL.Unit],
											skipTopMargin: true,
											styleSuffix: "3"
										})
									);
								}
							}

							// render from - to 
							if ((curResVal[_POS_RES_VAL.PerStart] && curResVal[_POS_RES_VAL.PerStart] !== "") ||
								(curResVal[_POS_RES_VAL.PerEnd] && curResVal[_POS_RES_VAL.PerEnd] !== "")) {
								displayTxt = this._formatTranslation(
									this._translate("i18n>result.chkc.PeriodS.text"), // =From {0} to {1}
									curResVal[_POS_RES_VAL.PerStart],
									curResVal[_POS_RES_VAL.PerEnd]);
								displayedElements.push(
									new ResultLine({
										label: displayTxt,
										tag: _KNOWN_TAGS.PerStartEnd,
										text: this._translate("i18n>all.3dots"), // ...
										skipTopMargin: true,
										styleSuffix: "3"
									})
								);
							}

							// render help text for FUTU
							if (!hasMore) {
								helpText = new sap.m.Text({
									wrappingType: "Hyphenated",
									wrapping: true,
									text: this._translate("i18n>result.chkp.FUTU.helptext")
								});
								helpText.addStyleClass("sapUiSmallMargin");
								// helpText.addStyleClass("sapMLabel"); // to have a grey ink color --> doesn't work as style class sapMText is used with higher priority
								displayedElements.push(helpText);
							}

						} else if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000LLOG") {
							hasMore = (nextResVal[_POS_RES_VAL.GenId] === "CHKP000000LLOG");
							// render blank line 
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							// render headline 			
							if (prevResVal[_POS_RES_VAL.GenId] !== "CHKP000000LLOG") {
								displayTxt = this._translate("i18n>result.chkp.LLOG.headline"); // 
								title = new Label({
									text: displayTxt,
									design: sap.m.LabelDesign.Bold,
									wrapping: true
								});
								displayedElements.push(title);
							}

							// render tag & value
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chkp.FUTU.Counter.desc"), //
								curResVal[_POS_RES_VAL.Counter]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Counter,
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: true,
									styleSuffix: "2"
								})
							);

							if (curResVal[_POS_RES_VAL.Unit]) {
								displayTxt = null;
								if (curResVal[_POS_RES_VAL.Unit] === "PERW000012") {
									displayTxt = this._translate("i18n>result.chkp.DELU.Unit.period_12.txt");
								} else if (curResVal[_POS_RES_VAL.Unit] === "PERW000004") {
									displayTxt = this._translate("i18n>result.chkp.DELU.Unit.period_4.txt");
								} else if (curResVal[_POS_RES_VAL.Unit] === "PERW000001") {
									displayTxt = this._translate("i18n>result.chkp.DELU.Unit.period_1.txt");
								}
								if (displayTxt) {
									displayedElements.push(
										new ResultLine({
											label: displayTxt,
											tag: _KNOWN_TAGS.Unit,
											text: curResVal[_POS_RES_VAL.Unit],
											skipTopMargin: true,
											styleSuffix: "3"
										})
									);
								}
							}

							// render from - to 
							if ((curResVal[_POS_RES_VAL.PerStart] && curResVal[_POS_RES_VAL.PerStart] !== "") ||
								(curResVal[_POS_RES_VAL.PerEnd] && curResVal[_POS_RES_VAL.PerEnd] !== "")) {
								displayTxt = this._formatTranslation(
									this._translate("i18n>result.chkc.PeriodS.text"), // =From {0} to {1}
									curResVal[_POS_RES_VAL.PerStart],
									curResVal[_POS_RES_VAL.PerEnd]);
								displayedElements.push(
									new ResultLine({
										label: displayTxt,
										tag: _KNOWN_TAGS.PerStartEnd,
										text: this._translate("i18n>all.3dots"), // ...
										skipTopMargin: true,
										styleSuffix: "3"
									})
								);
							}

							// render help text for LLOG
							if (!hasMore) {
								var helpText = new sap.m.Text({
									wrappingType: "Hyphenated",
									wrapping: true,
									text: this._translate("i18n>result.chkp.LLOG.helptext")
								});
								helpText.addStyleClass("sapUiSmallMargin");
								// helpText.addStyleClass("sapMLabel"); // to have a grey ink color --> doesn't work as style class sapMText is used with higher priority
								displayedElements.push(helpText);
							}

						} else if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000MLOG" || curResVal[_POS_RES_VAL.GenId] === "CHKP000000MLPK") {
							curMlStackLine = [];
							curMlStackLine[0] = curResVal[_POS_RES_VAL.At1];
							curMlStackLine[1] = curResVal;
							// curMlStackLine[2] = codeStr;
							// curMlStackLine[3] = codeLine;
							if (mlogStack == null) {
								mlogStack = [];
							}
							if (mlpkStack == null) {
								mlpkStack = [];
							}

							if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000MLOG") {
								// add to MLOG stack
								mlogStack.push(curMlStackLine);
							} else {
								// add to MLPK stack
								mlpkStack.push(curMlStackLine);
							}

							// check if next result is no CHKP000000MLOG/MLPK and rendering need to be done 
							if (nextResVal[_POS_RES_VAL.GenId] !== "CHKP000000MLOG" && nextResVal[_POS_RES_VAL.GenId] !== "CHKP000000MLPK") {
								// this result was the last in the MLOG/MLPK stack, so start rendering now

								// loop over mlog stack and render each element
								if (mlogStack != null && mlogStack.length > 0) {
									mlogStack.sort();
									if (mlpkStack.length > 0) {
										mlpkStack.sort();
									}

									// forEach + function call or (BETTER: for loop over the length)
									for (var sl = 0; sl < mlogStack.length; sl++) {
										// render blank line 
										title = new ClearLine({
											style: "elxCL1"
										});
										displayedElements.push(title);

										if (sl == 0) {
											// first line: headline 			
											displayTxt = this._translate("i18n>result.chkp.MLOG.headline"); // =Indicator: Users deleted before the measurement
											title = new Label({
												text: displayTxt,
												design: sap.m.LabelDesign.Bold,
												wrapping: true
											});
											displayedElements.push(title);
										}

										// render MLOG entry plus corresponding MPLK entry
										displayTxt = mlogStack[sl][0];
										if (displayTxt !== null && displayTxt.length == 6) {
											displayTxt = this._formatTranslation(
												this._translate("i18n>result.chkp.MLOG.month.text"), // =In the month {0}, multiple log ons occured
												displayTxt.substr(0, 4),
												displayTxt.substr(4, 2)
											);
										} else {
											displayTxt = this._formatTranslation(
												this._translate("i18n>result.chkp.MLOG.month.text"), // =In the month {0}, multiple log ons occured
												displayTxt,
												"");
										}
										displayedElements.push(
											new ResultLine({
												label: displayTxt,
												tag: _KNOWN_TAGS.Attributes1,
												text: mlogStack[sl][0],
												skipTopMargin: true,
												styleSuffix: "2"
											})
										);

										// render MLOG conter
										displayTxt = this._formatTranslation(
											this._translate("i18n>result.chkp.MLOG.number.text"), // =- {0} times
											mlogStack[sl][1][_POS_RES_VAL.Counter]);
										displayedElements.push(
											new ResultLine({
												label: displayTxt,
												tag: _KNOWN_TAGS.Counter,
												text: mlogStack[sl][1][_POS_RES_VAL.Counter],
												skipTopMargin: true,
												styleSuffix: "3"
											})
										);

										if (mlpkStack.length > 0 && mlpkStack[sl][0] === mlogStack[sl][0]) {
											displayTxt = this._formatTranslation(
												this._translate("i18n>result.chkp.MLOG.peak.text"), // =- with {0} logons at a time 
												mlpkStack[sl][1][_POS_RES_VAL.Counter]);
											displayedElements.push(
												new ResultLine({
													label: displayTxt,
													tag: _KNOWN_TAGS.Counter,
													text: mlpkStack[sl][1][_POS_RES_VAL.Counter],
													skipTopMargin: true,
													styleSuffix: "3"
												}));
										} else {
											// There are cases where no MLPK entries exist - nothing to do 
											displayedElements.push(
												new ResultLine({
													label: this._translate("i18n>result.chkp.MLOG.nopeak.text"),
													tag: "",
													text: "",
													skipTopMargin: true,
													styleSuffix: "3"
												}));
										}
									}

									// render help text for MLOG/
									helpText = new sap.m.Text({
										wrappingType: "Hyphenated",
										wrapping: true,
										text: this._translate("i18n>result.chkp.MLOG.helptext")
									});
									helpText.addStyleClass("sapUiSmallMargin");
									// helpText.addStyleClass("sapMLabel"); // to have a grey ink color --> doesn't work as style class sapMText is used with higher priority
									displayedElements.push(helpText);

								} else {
									// @TODO unlikly/potential case: why should there be only MLPK entries?
								}

								// @TODO unlikly/potential case: check if mlpk stack has unprocessed entries 

								hasMore = false; // creates a new result block after this one
							} else {
								hasMore = true; // prevents direct rendering of single result blocks in the XML editor
							}

						} else if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000BPRL") {
							// render blank line 
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							// render headline 			
							if (prevResVal[_POS_RES_VAL.GenId] !== "CHKP000000BPRL") {
								displayTxt = this._translate("i18n>result.chkp.BPRL.headline"); // 
								title = new Label({
									text: displayTxt,
									design: sap.m.LabelDesign.Bold,
									wrapping: true
								});
								displayedElements.push(title);
							}

							// render tag & value
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chkp.FUTU.Counter.desc"), //
								curResVal[_POS_RES_VAL.Counter]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Counter,
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: true,
									styleSuffix: "2"
								})
							);

							// render help text for BPRL/
							helpText = new sap.m.Text({
								wrappingType: "Hyphenated",
								wrapping: true,
								text: this._translate("i18n>result.chkp.BPRL.helptext")
							});
							helpText.addStyleClass("sapUiSmallMargin");
							// helpText.addStyleClass("sapMLabel"); // to have a grey ink color --> doesn't work as style class sapMText is used with higher priority
							displayedElements.push(helpText);

						} else if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000EXCU") {
							hasMore = (nextResVal[_POS_RES_VAL.GenId] === "CHKP000000EXCU");

							if (prevResVal[_POS_RES_VAL.GenId] !== "CHKP000000EXCU") {
								// render blank line 
								title = new ClearLine({
									style: "elxCL1"
								});
								displayedElements.push(title);

								// render headline 	
								displayTxt = this._translate("i18n>result.chkp.EXCU.headline"); // 
								title = new Label({
									text: displayTxt,
									design: sap.m.LabelDesign.Bold,
									wrapping: true
								});
								displayedElements.push(title);
							}

							// render tag & value
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chkp.EXCU.user"), //
								curResVal[_POS_RES_VAL.At1]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Attributes1,
									text: curResVal[_POS_RES_VAL.At1],
									skipTopMargin: true,
									styleSuffix: "2"
								})
							);

							if (!hasMore) {
								// render blank line 
								title = new ClearLine({
									style: "elxCL1"
								});
								displayedElements.push(title);

								// render help text for EXCU
								helpText = new sap.m.Text({
									wrappingType: "Hyphenated",
									wrapping: true,
									text: this._translate("i18n>result.chkp.EXCU.helptext")
								});
								helpText.addStyleClass("sapUiSmallMargin");
								// helpText.addStyleClass("sapMLabel"); // to have a grey ink color --> doesn't work as style class sapMText is used with higher priority
								displayedElements.push(helpText);
							}

						} else if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000USRD") {
							hasMore = (nextResVal[_POS_RES_VAL.GenId] === "CHKP000000USRD");

							if (prevResVal[_POS_RES_VAL.GenId] !== "CHKP000000USRD") {
								// render blank line 
								title = new ClearLine({
									style: "elxCL1"
								});
								displayedElements.push(title);

								// render headline 										
								displayTxt = this._translate("i18n>result.chkp.USRD.headline"); // 
								title = new Label({
									text: displayTxt,
									design: sap.m.LabelDesign.Bold,
									wrapping: true
								});
								displayedElements.push(title);
							}

							// render tag & value
							switch (curResVal[_POS_RES_VAL.Unit]) {
							case "TUT000000A":
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTA.txt");
								break;
							case "TUT000000B":
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTB.txt");
								break;
							case "TUT000000C":
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTC.txt");
								break;
							case "TUT000000S":
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTS.txt");
								break;
							case "TUT000000L":
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTL.txt");
								break;
							default:
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTX.txt");
							}
							displayTxt = this._formatTranslation(
								displayTxt, //
								curResVal[_POS_RES_VAL.Counter]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Counter,
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: true,
									styleSuffix: "3"
								})
							);

							if (!hasMore) {
								// render help text for USRD/
								helpText = new sap.m.Text({
									wrappingType: "Hyphenated",
									wrapping: true,
									text: this._translate("i18n>result.chkp.USRD.helptext")
								});
								helpText.addStyleClass("sapUiSmallMargin");
								// helpText.addStyleClass("sapMLabel"); // to have a grey ink color --> doesn't work as style class sapMText is used with higher priority
								displayedElements.push(helpText);
							}

						} else if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000NCTU") {
							hasMore = (nextResVal[_POS_RES_VAL.GenId] === "CHKP000000NCTU");

							if (prevResVal[_POS_RES_VAL.GenId] !== "CHKP000000NCTU") {
								// render blank line 
								title = new ClearLine({
									style: "elxCL1"
								});
								displayedElements.push(title);

								// render headline 										
								displayTxt = this._translate("i18n>result.chkp.NCTU.headline"); // 
								title = new Label({
									text: displayTxt,
									design: sap.m.LabelDesign.Bold,
									wrapping: true
								});
								displayedElements.push(title);
							}

							// render tag & value
							switch (curResVal[_POS_RES_VAL.Unit]) {
							case "TUT000000A":
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTA.txt");
								break;
							case "TUT000000B":
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTB.txt");
								break;
							case "TUT000000C":
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTC.txt");
								break;
							case "TUT000000S":
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTS.txt");
								break;
							case "TUT000000L":
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTL.txt");
								break;
							default:
								displayTxt = this._translate("i18n>result.chkp.USRD.TUTX.txt");
							}
							displayTxt = this._formatTranslation(
								displayTxt, //
								curResVal[_POS_RES_VAL.Counter]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Counter,
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: true,
									styleSuffix: "3"
								})
							);

							// render help text for NCTU
							if (!hasMore) {
								var helpText = new sap.m.Text({
									wrappingType: "Hyphenated",
									wrapping: true,
									text: this._translate("i18n>result.chkp.NCTU.helptext")
								});
								helpText.addStyleClass("sapUiSmallMargin");
								// helpText.addStyleClass("sapMLabel"); // to have a grey ink color --> doesn't work as style class sapMText is used with higher priority
								displayedElements.push(helpText);
							}

						} else if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000MUGP") {
							hasMore = (nextResVal[_POS_RES_VAL.GenId] === "CHKP000000MUG2");

							// render blank line 
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							// render headline 							
							displayTxt = this._translate("i18n>result.chkp.MUGP.headline"); // Check for multiple user records grouped into one user in the same client
							title = new Label({
								text: displayTxt,
								design: sap.m.LabelDesign.Bold,
								wrapping: true
							});
							displayedElements.push(title);

							// render tag & value
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chkp.MUGP"), // {0} cases with multiple user records
								curResVal[_POS_RES_VAL.Counter]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: curResVal[_POS_RES_VAL.GenId],
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: true,
									styleSuffix: "2"
								})
							);

							if (!hasMore) {
								// render help text for MUGP/MUG2
								helpText = new sap.m.Text({
									wrappingType: "Hyphenated",
									wrapping: true,
									text: this._translate("i18n>result.chkp.MUGP.helptext")
								});
								helpText.addStyleClass("sapUiSmallMargin");
								// helpText.addStyleClass("sapMLabel"); // to have a grey ink color --> doesn't work as style class sapMText is used with higher priority
								displayedElements.push(helpText);
							}

						} else if (curResVal[_POS_RES_VAL.GenId] === "CHKP000000MUG2") {
							hasMore = (nextResVal[_POS_RES_VAL.GenId] === "CHKP000000MUG2");

							// render tag & value
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chkp.MUG2"), // result.chkp.MUG2=Case with {0} user records for one person 
								curResVal[_POS_RES_VAL.Counter]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: curResVal[_POS_RES_VAL.GenId],
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: true,
									styleSuffix: "3"
								})
							);

							if (!hasMore) {
								// render help text for MUGP/MUG2
								helpText = new sap.m.Text({
									wrappingType: "Hyphenated",
									wrapping: true,
									text: this._translate("i18n>result.chkp.MUGP.helptext")
								});
								helpText.addStyleClass("sapUiSmallMargin");
								// helpText.addStyleClass("sapMLabel"); // to have a grey ink color --> doesn't work as style class sapMText is used with higher priority
								displayedElements.push(helpText);
							}

						} else {
							// no template applied, so simply render the tags and values							
							childLine = 0;
							while (childLine < curResult.childElementCount) {
								curResChild = curResult.children[childLine];
								displayTxt = this._getTagTranslation(curResChild.tagName, curResChild.innerHTML, false, curResChild.innerHTML, curResVal[
									_POS_RES_VAL.GenId_F4]);
								displayedElements.push(
									new ResultLine({
										// firstTag: "Result",
										// title: "Key tags in the next <Result> block(s)",
										label: displayTxt,
										tag: curResChild.tagName,
										text: curResChild.innerHTML,
										skipTopMargin: (childLine > 0)
									}));
								childLine++;
							}
							resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
							resultArray.push(resultElement);
							// reset 
							codeStr = "";
							displayedElements = new Array();
							resBlockStartLine = codeLine;
						}

						// after handling all CHKP templates, start new block where necessary
						if (!hasMore) {
							// end result block handling
							resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
							resultArray.push(resultElement);
							// reset 
							codeStr = "";
							displayedElements = new Array();
							resBlockStartLine = codeLine;
						} else {
							codeStr = codeStr + "\n";
						}
						prevResVal = curResVal;

					} else if ("CHKC" === curResVal[_POS_RES_VAL.GenId_F4]) {
						hasMore = (nextResVal[_POS_RES_VAL.GenId_F4] === "CHKC");

						// render blank line 
						title = new ClearLine({
							style: "elxCL1"
						});
						displayedElements.push(title);

						// render headline if this is the first entry
						if (prevResVal[_POS_RES_VAL.GenId_F4] !== "CHKC") {
                        	var cisData = this._getCustInfoSheetData("CHKC");
							// Render a link to the developer check documentation
							title = new Link({
								text: cisData[_CIS_DATA.Title], // =Workbench User / Developer Check  
								target: "_blank",
								wrapping: true,
								href: cisData[_CIS_DATA.URL]
							});
							title.addStyleClass(_TITLE_CSS);
							displayedElements.push(title);
							
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);
						}
						
						if (prevResVal[_POS_RES_VAL.GenId_F4] !== "CHKC" || curResVal[_POS_RES_VAL.Unit] !== prevResVal[_POS_RES_VAL.Unit]) {
							if (curResVal[_POS_RES_VAL.Unit] === "CHKC000000") {
								displayTxt = this._translate("i18n>result.chkc.headline.prof"); // =Indicator: Classification checks for (Ltd.) Professional users
							} else {
								displayTxt = this._translate("i18n>result.chkc.headline.dev"); // =Indicator: Classification checks for Developer users
							}

							title = new Label({
								text: displayTxt,
								design: sap.m.LabelDesign.Bold,
								wrapping: true
							});
							displayedElements.push(title);
						}

						// render caption for each new check
						if (curResVal[_POS_RES_VAL.Unit] !== prevResVal[_POS_RES_VAL.Unit]) {
							if (curResVal[_POS_RES_VAL.Unit] === "CHKC000000") {
								// Check for (Ltd.) Professional Users
								displayTxt = this._translate("i18n>result.chkc.prof.unit"); // Check for (Ltd.) Professional Users
							} else if (curResVal[_POS_RES_VAL.Unit] === "CHKC000001") {
								// Check for developers 
								displayTxt = this._translate("i18n>result.chkc.dev.01.unit"); // Check for developers 
							} else if (curResVal[_POS_RES_VAL.Unit] === "CHKC000002") {
								// Check for developers 
								displayTxt = this._translate("i18n>result.chkc.dev.02.unit"); // Check for developers 
							} else {
								// unknown check
								displayTxt = this._translate("i18n>result.chkc.unknown.unit"); // Unknown check  
							}
							// render type of check
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.Unit,
									text: curResVal[_POS_RES_VAL.Unit],
									skipTopMargin: true,
									styleSuffix: "2"
								})
							);
						}

						// render counter
						displayTxt = this._formatTranslation(
							this._translate("i18n>result.chkc.counter"), // =found {0} users which are classified as
							curResVal[_POS_RES_VAL.Counter]);
						displayedElements.push(
							new ResultLine({
								label: displayTxt,
								tag: _KNOWN_TAGS.Counter,
								text: curResVal[_POS_RES_VAL.Counter],
								skipTopMargin: true,
								styleSuffix: "3"
							})
						);

						// render classification
						displayTxt = curResVal[_POS_RES_VAL.At1] + ": " + this._getTutypText(curResVal[_POS_RES_VAL.At1]); // e.g. 92 External Contact
						displayedElements.push(
							new ResultLine({
								label: displayTxt,
								tag: _KNOWN_TAGS.Attributes1,
								text: curResVal[_POS_RES_VAL.At1],
								skipTopMargin: true,
								styleSuffix: "3"
							})
						);

						// render from - to 
						if ((curResVal[_POS_RES_VAL.PerStart] && curResVal[_POS_RES_VAL.PerStart] !== "") ||
							(curResVal[_POS_RES_VAL.PerEnd] && curResVal[_POS_RES_VAL.PerEnd] !== "")) {
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chkc.Period.text"), // =From {0} to {1}
								curResVal[_POS_RES_VAL.PerStart],
								curResVal[_POS_RES_VAL.PerEnd]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.PerStartEnd,
									text: this._translate("i18n>all.3dots"), // ...
									skipTopMargin: true,
									styleSuffix: "3"
								})
							);
						}

						// render comment if this is the last entry
						if (nextResVal[_POS_RES_VAL.GenId_F4] !== "CHKC" || curResVal[_POS_RES_VAL.Unit] !== nextResVal[_POS_RES_VAL.Unit]) {
							// render blank line 
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);

							if (curResVal[_POS_RES_VAL.Unit] === "CHKC000000") {
								// Check for (Ltd.) Professional Users
								displayTxt = this._translate("i18n>result.chkc.desc00.text"); // Check for (Ltd.) Professional Users
							} else if (curResVal[_POS_RES_VAL.Unit] === "CHKC000001") {
								// Check for developers 
								displayTxt = this._translate("i18n>result.chkc.desc01.text"); // Check for developers 
							} else if (curResVal[_POS_RES_VAL.Unit] === "CHKC000002") {
								// Check for developers 
								displayTxt = this._translate("i18n>result.chkc.desc02.text"); // Check for developers 
							}
							title = new Label({
								text: displayTxt,
								wrapping: true
							});
							title.addStyleClass("elxSrlSpanL2");
							displayedElements.push(title);

							// render blank line 
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);
						}

						if (!hasMore) {
							// end result block handling
							resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
							resultArray.push(resultElement);
							// reset 
							codeStr = "";
							displayedElements = new Array();
							resBlockStartLine = codeLine;
						} else {
							codeStr = codeStr + "\n";
						}
						prevResVal = curResVal;

					} else if ("CHKA" === curResVal[_POS_RES_VAL.GenId_F4]) {
						hasMore = (nextResVal[_POS_RES_VAL.GenId_F4] === "CHKA");

						// render blank line 
						title = new ClearLine({
							style: "elxCL1"
						});
						displayedElements.push(title);

						// render headline if this is the first entry
						if (prevResVal[_POS_RES_VAL.GenId_F4] !== "CHKA") {
							displayTxt = this._translate("i18n>result.chka.headline"); // =Indicator: Classification checks for (Ltd.) Professional and Developer users
							title = new Label({
								text: displayTxt,
								design: sap.m.LabelDesign.Bold,
								wrapping: true
							});
							displayedElements.push(title);
						}

						if (!prevResVal[_POS_RES_VAL.PerStart] || prevResVal[_POS_RES_VAL.PerStart] !== curResVal[_POS_RES_VAL.PerStart] ||
							!prevResVal[_POS_RES_VAL.PerEnd] || prevResVal[_POS_RES_VAL.PerEnd] !== curResVal[_POS_RES_VAL.PerEnd]) {
							// render from - to 
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chkc.Period.text"), // =From {0} to {1}
								curResVal[_POS_RES_VAL.PerStart],
								curResVal[_POS_RES_VAL.PerEnd]);
							displayedElements.push(
								new ResultLine({
									label: displayTxt,
									tag: _KNOWN_TAGS.PerStartEnd,
									text: this._translate("i18n>all.3dots"), // ...
									skipTopMargin: true,
									styleSuffix: "2"
								})
							);
						}

						displayTxt = this._formatTranslation(
							this._translate("i18n>result.chka.unit"), // =into table {0} {1}
							curResVal[_POS_RES_VAL.Unit_L4],
							this._getTul_ActtcText(curResVal[_POS_RES_VAL.Unit_L4]));
						// render type of check
						displayedElements.push(
							new ResultLine({
								label: displayTxt,
								tag: _KNOWN_TAGS.Unit,
								text: curResVal[_POS_RES_VAL.Unit],
								skipTopMargin: true,
								styleSuffix: "3"
							})
						);

						// render counter
						if (curResVal[_POS_RES_VAL.GenId_L2] === "06") {
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chka6.counter"), // ={0} entries were made 
								curResVal[_POS_RES_VAL.Counter]);
						} else if (curResVal[_POS_RES_VAL.GenId_L2] === "05") {
							displayTxt = this._formatTranslation(
								this._translate("i18n>result.chka5.counter"), // ={0}% of entries were made
								curResVal[_POS_RES_VAL.Counter]);
						} else {
							displayTxt = _KNOWN_TAGS.Counter;
						}
						displayedElements.push(
							new ResultLine({
								label: displayTxt,
								tag: _KNOWN_TAGS.Counter,
								text: curResVal[_POS_RES_VAL.Counter],
								skipTopMargin: true,
								styleSuffix: "3"
							})
						);

						if (!hasMore) {
							// render comment	
							title = new ClearLine({
								style: "elxCL1"
							});
							displayedElements.push(title);
							title = new Label({
								text: this._translate("i18n>result.chka.desc"),
								wrapping: true
							});
							title.addStyleClass("elxSrlSpanL3");
							displayedElements.push(title);

							// end result block handling
							resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
							resultArray.push(resultElement);
							// reset 
							codeStr = "";
							displayedElements = new Array();
							resBlockStartLine = codeLine;
						} else {
							codeStr = codeStr + "\n";
						}
						prevResVal = curResVal;
					} else {
						// no template applied, so simply render the tags and values
						childLine = 0;
						while (childLine < curResult.childElementCount) {
							curResChild = curResult.children[childLine];
							displayTxt = this._getTagTranslation(curResChild.tagName, curResChild.innerHTML, false, curResChild.innerHTML, curResVal[
								_POS_RES_VAL.GenId_F4]);
							displayedElements.push(
								new ResultLine({
									// firstTag: "Result",
									// title: "Key tags in the next <Result> block(s)",
									label: displayTxt,
									tag: curResChild.tagName,
									text: curResChild.innerHTML,
									skipTopMargin: (childLine > 0)
								}));
							childLine++;
						}
						resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
						resultArray.push(resultElement);
						// reset 
						codeStr = "";
						displayedElements = new Array();
						resBlockStartLine = codeLine;
					}
				}
				resElem++;
			}

			// render tailing </Part> tag
			codeStr = "\t\t</Part>";
			if (isLastResult) {
				codeStr = codeStr + "\n\t</Results>\n</Measurement>";
			}

			resultElement = new Array(displayedElements, codeStr, resBlockStartLine, null);
			resultArray.push(resultElement);

			this._renderResultList(resultArray, isFirstBlock);
		},

		/*
						<!-- <cols:EqualWidthColumns id="dynArea">
							<cols:content>
								<Panel headerText="Col 1"></Panel>
								<Panel headerText="Col 2" id="testEditor"></Panel>
							</cols:content>
						</cols:EqualWidthColumns> -->
						<!-- END: Test area dynamic code editor section -->
				*/
		_renderResultList: function (resultArray, isFirstBlock) {
			// console.log("Started building UI ");
			_i18nBundle = this.getView().getModel("i18n").getResourceBundle();

			/*	ListBase > growing: works when an items aggregation is bound. 
				ListBase.bindItems(oBindingInfo): Binds aggregation items to model data. See ManagedObject.bindAggregation for a detailed description of the possible properties of oBindingInfo.
			var area = this.oView.byId("resultList");
			var items = new ListItemBase(); */

			var area = this.oView.byId("resultList");
			// area.destroyContent(); 
			area.removeAllContent();

			var moreButton = this.oView.byId("moreButton");
			var hlTitle;
			if (!resultArray || resultArray.length == 0) {
				// there are no results
				var hlTitle = new Title({
					text: this._translate("i18n>result.noData.text"),
					level: "H4"
				});
				hlTitle.addStyleClass("results");
				area.addContent(hlTitle);
				moreButton.setVisible(false);
				return;
			} else {
				hlTitle = new Title({
					text: this._translate("i18n>part.page.title.text"),
					level: "H2"
				});
				hlTitle.addStyleClass("results");
				area.addContent(hlTitle);
				if (isFirstBlock) {
					moreButton = this.oView.byId("moreButton");
					if (resultArray.length > _firstLinesToShow) {
						moreButton.setVisible(true);
						moreButton.setText(this._formatTranslation(
							this._translate("i18n>result.more.button.text.N"),
							_firstLinesToShow,
							(resultArray.length - 1)
						));
					} else {
						moreButton.setVisible(false);
					}
				}
			}

			var resItemIdx;
			resItemIdx = 0;

			while (resItemIdx < resultArray.length) {
				if (isFirstBlock && resItemIdx >= _firstLinesToShow) {
					break;
				} else {
					var displayedElements = resultArray[resItemIdx][0];
					// var panL = new Panel( { headerText: "Result " + resItemIdx });
					var panL = new VerticalLayout({
						width: "100%"
					});
					panL.addStyleClass("sapUiTinyMargin");
					panL.addStyleClass("sapUiNoMarginBottom");
					panL.addStyleClass("lineBefore");
					for (var i = 0; i < displayedElements.length; i++) {
						panL.addContent(displayedElements[i]);
					}

					var codeStr = resultArray[resItemIdx][1];
					// var panR = new Panel( { headerText: "XML"});
					var panR = new VerticalLayout({
						width: "100%"
					});
					panR.addStyleClass("sapUiTinyMargin");

					/* var plh = new Label( { text: resultArray[resItemIdx][2] });
					panR.addContent(plh); */

					var codeEditor = new CodeEditor({
						colorTheme: "tomorrow",
						type: "xml"
					});
					codeEditor.setMaxLines(100000000);

					this.buildEditor(codeStr, codeEditor, resultArray[resItemIdx][2]);
					panR.addContent(codeEditor);

					// var twoCol = new HorizontalLayout();
					var twoCol = new EqualWidthColumns();
					twoCol.addContent(panL);
					twoCol.addContent(panR);
					/* var nextItem = new CustomListItem (resItemIdx);
					nextItem.addContent(twoCol); */
					area.addContent(twoCol);
					resItemIdx++;
				}
			}
		},

		back: function (oEvent) {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.oRouter.navTo("elements");
			}
		},

		backToSystem: function (oEvent) {
			this.oRouter.navTo("system", {
				sysIndex: this.sysIdx
			});
		},

		navToPrevBlock: function () {
			if (this._resultSelected) {
				// next result, not next part (as it may have no results)!
				var resIndx = Number.parseInt(this._resultSelected.substr("resultid/".length, this._resultSelected.length));
				if (resIndx > 0) {
					// navigate to previous result
					resIndx = resIndx - 1;
					this._resultSelected = "resultid/" + resIndx;
					this.navigateToResultIndex(resIndx);
				} else {
					// navigate to last part and reset result selection
					this.resetResultSelection();
					var _iPartIndex = this._oModel.getData().children[0]._tagMeasurementPartsHook.childElementCount - 1;
					this.navigateToPartIndex(_iPartIndex);
				}
			} else {
				var _iPartIndex = parseInt(this.partIdx) - 1;
				// var _iSysIndex = this._getCorrespondingSystem(_iPartIndex);
				if (_iPartIndex >= 0) {
					// navigate to part with current index - 1				
					var address = this.navigateToPartIndex(_iPartIndex);
				} else {
					this.resetResultSelection();
					// navigate to system with highest index
					var systemCount = this.iSystemsCount - 1;
					this.oRouter.navTo("system", {
						sysIndex: systemCount
					});
				}
			}
		},

		navToNextBlock: function () {
			if (this._resultSelected) {
				// next result, not next part (as it may have no results)!
				var resIndx = Number.parseInt(this._resultSelected.substr("resultid/".length, this._resultSelected.length));
				if (resIndx < this._oModel.getData().children[0]._tagMeasurementResultsHook.childElementCount - 1) {
					this._resultSelected = "resultid/" + (resIndx + 1);
					this.navigateToResultIndex(resIndx + 1);
				}
			} else {
				var _iPartIndex = parseInt(this.partIdx) + 1;
				if (_iPartIndex >= this._oModel.getData().children[0]._tagMeasurementPartsHook.childElementCount) {
					// first result
					this._resultSelected = "resultid/0";
					this.navigateToResultIndex(0);
				} else {
					// next part
					var address = this.navigateToPartIndex(_iPartIndex);
				}
			}
		},

		onNavLoad: function () {
			this.resetResultSelection();
			this.oRouter.navTo("intro");
		},

		onNavAll: function () {
			this.resetResultSelection();
			this.oRouter.navTo("elements");
		},

		onNavSystemList: function () {
			this.resetResultSelection();
			this.oRouter.navTo("systems");

		},

		onNavSystem: function () {
			this.resetResultSelection();
			this.oRouter.navTo("system", {
				sysIndex: this.sysIdx
			});
		}

	});
});