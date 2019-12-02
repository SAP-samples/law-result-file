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
	"sap/m/Title"
], function (BaseController, JSONModel, XMLView, ResourceModel, Log, formatter, Filter, FilterOperator, ResultLine, 
				EqualWidthColumns, ClearLine,
				ResourceBundle, Label, Panel, Link, CodeEditor, List, ListItemBase, HorizontalLayout, CustomListItem, VerticalLayout, Title) {
	"use strict";
	
	
	var _i18nBundle; // holds the resource bundle for text translation
	// var _translatableTags;	// holds the set of tags with 'tag' and 'trans' attributes from the tagsTranslation.json file;
							// 'tags' list XML tags from LAW which needs to be explaned, 'trans' the corresponding translation
							// example: tag <PerStart> will be replaced by "from" for the description part
							
	var _translatableTexts;	// holds the set of texts where either 'tag' should  match a tag or a provided text should start with 'innerHTML', or both.
							// 
	// var _engineNames;	// is an copy of the TUUNT table in JSON format which holds the texts and function modules for the engine IDs. 
							// In contrast to the LAW results, Ids are provided here without leading 0s.
			/* 			"engineNames": {
				"type": "sap.ui.model.json.JSONModel",
				"settings": {},
				"uri": "./model/tuunt.json",
				"preload": true
			}, */
	var _engineModules;		// holds a copy of the table TUAPP;
	var _custInfos;			// lists units and the corresponding customer information sheets
	var _tuuntTexts;		// holds a copy of the table TUUNT
	var _tutypTexts;		// holds a copy of the table TUTYP
	var _cis_defaults;		// holds the generic URL for the engine page & a title; 
			
	// Constant values					
	var MONTHS =				[ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
	var _RESULT_TYPES = 		{ "PartId":0,			"USR": 1,		"ENGS": 2,		"ENGC": 3,		"CHK": 4,		"Unknown": 9 };	// for each result type (except PartId) a new Panel element will be rendered
	// var _RESULT_TYPES_STR =		{ "PartId":"PartId",	"USR": "USR",	"ENGS": "ENGS",	"ENGC": "ENGC", "CHK": "CHK",	"Unknown": 9 };	// XML content to define ResultType
	// var _POS_RES_ARRAY =		{ "Controls": 0, "CodeStr": 1, "StartLine": 2, "BlockType" :3 };		// position of data elements in the array handed over from the buildResult to the renderResult methods
	var _POS_RES_VAL =			{ "GenId": 0, "GenId_F3": 1, "GenId_F4": 2, "GenId_L2": 3, "GenId_L4": 4, "At1": 5, "At2": 6, "Unit": 7, 
									"PerStart": 8, "PerEnd": 9, "Counter": 10, "CisUrl": 11, "CisTitle": 12, "TuUntTitle": 13 }; 	// position of various contentText/innerHTML values of the current result
	var _CIS_DATA = 			{ "URL": 0, "Title": 1 }; // used to decide if the URL or the Title should be read from the custInfoSheets.json file  
	var _KNOWN_TAGS =			{ "Counter": "Counter", "GenericId": "GenericId", "Attributes1": "Attribute1", "Attributes2": "Attribute2", "Unit":"Unit" }; // List of (case sensitive) tags used in the application and (potentially) used in the tagTranslation.json file
	var _TITLE_CSS =			  "results"; 		// style class for titles

	return BaseController.extend("glacelx.glacelx.controller.Part", {
		valueCheck: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
		},
		
		onInit: function () {
			this.route = this.oRouter.getRoute("part");
			this.oView = this.getView();

			this._checkInitialModel();
			this._oModel = this.getOwnerComponent().getModel("userXML");
			this.route.attachMatched(this._onRouteMatched, this);
			
			this.iPartsCount = this._oModel.getData().children[0]._tagMeasurementPartsHook.childElementCount;
			this.iSystemsCount = this._oModel.getData().children[0]._tagMeasurementSystemsHook.childElementCount;
			
			
		},

		_onRouteMatched: function (oEvent) {
			this._checkInitialModel();
			_i18nBundle = this.getView().getModel("i18n").getResourceBundle();
			// _translatableTags = this.getView().getModel("tags").getData().tags; 
			_translatableTexts = this.getView().getModel("trans").getData().trans;
			// _engineNames = this.getView().getModel("engineNames").getData().units; 
			_engineModules = this.getView().getModel("tuapp").getData().modules;
			_custInfos = this.getView().getModel("custInfos").getData().cis;
			_cis_defaults = this.getView().getModel("custInfos").getData().defaults;
			_tuuntTexts = this.getView().getModel("tu_untt").getData().unitsList;
			_tutypTexts = this.getView().getModel("tutyp").getData().types;
			
			/// ------------------- PARTS coding 
			// debugger;
			var oArgs, oView;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			this.sysIdx = oArgs.sysIndex;
			this.systPath = "/Systems/System/" + this.sysIdx;

			// bind system element to page back button
			var oForm = oView.byId("resultPage");
			oForm.bindElement({
				path: this.systPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function (oEvent) {
						oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						oView.setBusy(false);
					}
				}
			});

			// Build title for Result page, e.g. "Results for System C31, Client 100"
			var sysLabel = "(unknown)";
			var partLabel = sysLabel;
			// get system label (SID or fallback: SystemNo)
			var _iSAP_SID = this._oModel.getProperty(this.systPath + "/SAP_SID");
			var _iSystemNo = this._oModel.getProperty(this.systPath + "/SystemNo");
			var _oSys = this._oModel.getProperty(this.systPath);
			

			// i18n - get resource bundle 
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var iSysText = oBundle.getText("model.systems.System.text");
			var iClientText = oBundle.getText("part.page.client.text");

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

			// get client number or fallback: part index
			var partIdx = oArgs.partIndex;
			var iPartsPath = "/Parts/Part/" + partIdx;
			var _sSAP_CLIENT = this._oModel.getProperty(iPartsPath + "/SAP_CLIENT");
			var _sGenId = this._oModel.getProperty(iPartsPath + "/GenericId");
			
			var partClientText = formatter.formatClientRb (_sSAP_CLIENT, _sGenId, partIdx, oBundle);
			var partClientName = this._oModel.getProperty(iPartsPath + "/Name");

			// oForm.setTitle(iPartText + partIdx + " / " + sysLabel + partLabel);
			if (partClientName && partClientName !== "") {
				oForm.setTitle(sysLabel + " - " + partClientText + " / " + partClientName);
			} else {
				oForm.setTitle(sysLabel + " - " + partClientText);
			}
			
			/// ------  PROPERTIES coding -----------------------
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
			// this.oView.byId("indexProperty").setText("[" + this.partIdx + "]");
			
			var _mainModelRaw = this._oModel.getData().children[0];
			// navigate to part branch and extract data
			var _rawSystemData = _mainModelRaw._tagMeasurementPartsHook.children[this.partIdx];
			// set code editor context
			var _oSysCodeEditor = this.oView.byId("propertiesCE");
			// build editor context
			this.buildEditorContext(_rawSystemData, _oSysCodeEditor);			
			
			// --- build properties list
			var _propertiesArea = this.oView.byId("partProperties");
			_propertiesArea.destroyContent();
			// remove previous content
			// _propertiesArea.destroyContent(); 
			this._writeAllPropertyLines(_propertiesArea, _rawSystemData, partIdx);
			
			/// ----------- RESULTS coding -----------------------------
						// debugger;
			this.oView = this.getView();
			var oArgs = oEvent.getParameter("arguments");
			// set required indexes
			var sysIdx = oArgs.sysIndex;
			var partIdx = oArgs.partIndex;
			var resultIdx = this._getCorrespondingResultIndex(partIdx);

			// create binding for System Details
			// > bind part properties
			var resultPath = "/Results/Part/" + resultIdx;
			/* var oForm = this.oView.byId("selectedResult");
			oForm.bindElement({
				path: resultPath,
				model: "xmlFile",
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
			// oForm = this.oView.byId("resultTable"); */

			// navigate to part branch and extract data
			var _mainModelRaw = this._oModel.getData().children[0];
			var _result = _mainModelRaw._tagMeasurementResultsHook.children[resultIdx];
			this._buildResultList(_result);
			
			/*
			// set code editor context
			var _oSysCodeEditor = this.oView.byId("resultsCE");
			// build editor context
			this.buildEditorContext(_result, _oSysCodeEditor); */
			
			/* var _resultListArea = this.oView.byId("resultList");
			// remove previous content
			_resultListArea.destroyContent(); 
			this._writeAllResultLines(_resultListArea, _result); */
		},

		/* reads the tagsTranslation.json file (referred as 'file') and tries to get a translation for
			1. if the file contains in the 'tags" section an entry that matches the 'tag' variable, then 
				a) if a 'uiText' string value is provided, it will be returned; example: for tag 'PerStart' the translation 'From' will be returned
				b)	'uiText' could also be an array. This is required e.g. for the <Counter> tag. In this case, the translation will depend on
					content of the first tag. Known cases: firstTag is <GenericId>. 
						If the innerHTML starts with 'USRC', then "{0} users classified as" will be returned
						If the innerHTML starts with 'ENGC', then "{0} units counted
			2. If not tag translation is found, then the texts section is checked if their is a match for the innnerHTML.
				If the getMulti variable is true and a uiTextMulti element exists, this one is returned, otherwise the uiText value;
		If the file holds an entry for 'number', two cases are implemented:
			a) number = 'useValue': The innerHTML of the tag will be used, e.g. for <Counter>7</Counter> the 7 will be used to resovle/format
				e.g. '{0} users classified as' into '7 users classified as'
			b) number = 'useHTML': The tag will be split. If the tag is "USRC00000000EC" and the file innerHTML is "USRC00000000", then the 
				first part "USRC00000000" will be used for a 'startsWith())' check for the translation (returns e.g. '- Type {0}') and the
				seocnd part "EC" will be used to resolve/format the translation, so 
				the final result will be "- Type EC" 
		
		tag -			the tag
		innerHtml -		the value of the tag
		getMulti -		return the 'plural' text (to indicate cases with multiple entries)
		firstTagHtml -	e.g. get translation for USRC or for ENGC 
		secNum - the value of Attribute 2 (only used if translation's number = "useValue")
		*/
		/* _getTranslation: function (tag, innerHtml, getMulti, firstTagHtml, secNum) {
			// is there a translation for the tag?
			var i;
			var displayText, uiText;
			if (tag && tag !== "") {
				if (_translatableTags && _translatableTags.length > 0) {
					for (i = 0; i < _translatableTags.length; i++) {
					var transEntry = _translatableTags[i];
						var transTag = transEntry.tag;
						if (transTag && transTag !== "") {
							if (tag.toUpperCase().startsWith(transTag.toUpperCase())) {
								// If multiple uiTexts exist, find the proper one: by using the firstTagHtml value
								if (transEntry.uiText && typeof transEntry.uiText !== "string") {
									if (transEntry.uiText.length > 0) {
										for (var k=0; k < transEntry.uiText.length; k++) {
											if (typeof transEntry.uiText[k].firstHTML === 'string' && 
													typeof transEntry.uiText[k].uiText === 'string') {
												// both of the next two cases are relevant
												if (typeof firstTagHtml === 'string') { 
													if (firstTagHtml.toUpperCase().startsWith(transEntry.uiText[k].firstHTML.toUpperCase())) {
														displayText = transEntry.uiText[k].uiText;
														uiText = displayText;
														break;
													}
												} else if (innerHtml) {
													if (innerHtml.toUpperCase().startsWith(transEntry.uiText[k].firstHTML.toUpperCase())) {
														displayText = transEntry.uiText[k].uiText;
														uiText = displayText;
														break;
													}
												}
											} else { // ignore else case as it seems to be an invalid translation entry
												debugger;
											}
										}
										if (!displayText) {
											// no translation found
											// displayText = tag;
											// debugger;
										}
									} else {
										// no translation found
										// displayText = tag;
										// debugger;
									}
									break;
								} else {
									if (getMulti && transEntry.uiTextMulti) {
										displayText = transEntry.uiTextMulti;
									} else {
										displayText = transEntry.uiText;
									}
									break;
								}
							} // else: nothing to do, for next will try next translation tag
						} // else: nothing to do, for next will try next translation tag
					} // end loop
					if (displayText) {
						// translate if necessary
						displayText = this._translate(displayText);
						// format (replace {0} placeholders with numbers)
						if (transEntry.number && transEntry.number === "useValue" ) {
							return this._formatTranslation(	displayText,	// e.g. '{0} users classified as",
															innerHtml,		// e.g. 8 from <Counter>8</Counter>
															secNum			// used for Attribute2
														);
						}
						return transEntry.uiText;
					} // else: no translation found, try innerHTML part
				}
			} 
			// is there a translation for the innerHTML?
			if (!innerHtml || innerHtml === "") {
				return tag;
			}
	
			if (_translatableTexts && _translatableTexts.length > 0) {
				var uiText;
				for (i = 0; i < _translatableTexts.length; i++) {
					transEntry = _translatableTexts[i];
					var curText = transEntry.innerHTML;
					if (curText && curText !== "") {
						if (innerHtml.toUpperCase().startsWith(curText.toUpperCase())) {
							if (getMulti) {
								uiText = transEntry.uiTextMulti;
							} else {
								uiText = transEntry.uiText;
							}
							uiText = this._translate(uiText);

							// format (replace {0} placeholders with numbers)
							if (transEntry.number && transEntry.number === "useHtml") {
								var start = curText.length;
								var len = innerHtml.length - start;
								uiText = this._formatTranslation(	uiText,		// e.g. "- Type {0}",
																innerHtml.substr(start, len)
															);
							}
							return uiText;
						}
					}
				}
			}
			return this._translate("i18n>all.unspecified.text");
		}, */
		
		_getTuuntText: function (engine, metric) {
			if (engine && engine.trim() !== "" && metric && metric.trim() !== "") {
				
				// reduce engine variable to number without leading 0s  
				engine = engine.trim().toUpperCase();
				if (engine.startsWith("ENG")) { // ENGC or ENGS
					engine = engine.substr(3, engine.lenght);
				}
				while (engine.startsWith("0")) {
					engine = engine.substr(1, engine.lenght);
				}
				// reduce metric variable to number without leading 0s
				metric = metric.trim().toUpperCase();
				if (metric.startsWith("UNT")) {
					metric = metric.substr(3, metric.lenght);
				}
				while (metric.startsWith("0")) {
					metric = metric.substr(1, metric.lenght);
				}
				
				var units, curEngine, curUnit;
				for (var i = 0; i < _tuuntTexts.length; i++) {
					curEngine =  _tuuntTexts[i].engine;
					if (engine === curEngine) {
						units = _tuuntTexts[i].units;
						for (var j = 0; j < units.length; j++) {
							curUnit = _tuuntTexts[i].units[j].unit;
							if (curUnit === metric) {
								return metric + ": " + _tuuntTexts[i].units[j].unitName;
							}
						}
						// engine matched, but no corresponding metric entry. There won't be any further engine match, so return and use default text	
						// debugger;
						break; 
					}
				} 
			}
			// No entry found, use default text	
			return this._formatTranslation(	this._translate("i18n>result.metric.defaultTitle.txt"), // =License {0}
												metric); 
		},
		
		_getTutypText: function (uType) {
			if (uType && uType.trim() !== "") {
				uType = uType.trim().toUpperCase();
				if (uType.startsWith("USRC")) {
					uType = uType.substr(4, uType.lenght);
				}
				while (uType.startsWith("0")) {
					uType = uType.substr(1, uType.lenght);
				}
				var unit;
				for (var i = 0; i < _tutypTexts.length; i++) {
					unit = _tutypTexts[i].type;
					
					while (unit && unit.startsWith("0")) {
						unit = unit.substr(1, unit.lenght);
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
					engine = engine.substr(1, engine.lenght);
				}
			}
			
			var cur_applic;
			for (var i = 0; i < _engineModules.length; i++) {
				cur_applic = _engineModules[i].applic;
				if (engine === cur_applic) {
					if (_engineModules[i].name && _engineModules[i].name.trim() !== "") {
						if ( _engineModules[i].func_mod &&  _engineModules[i].func_mod.trim() !== "") {
							return this._formatTranslation(this._translate("i18n>result.engine.specificTitleModule.txt"), engId , _engineModules[i].name , _engineModules[i].func_mod);
						} else {
							return this._formatTranslation(this._translate("i18n>result.engine.specificTitle.txt"), engId , _engineModules[i].name );
						}
					} else {
						break; // no name for the engine, so just show default (Engine ID) 
					}
				}
			}
			return this._formatTranslation(this._translate("i18n>result.engine.defaultTitle.txt"), engId);
		},

		_getCustInfoSheetData: function (metric, retElement) {
			if (!metric || metric.trim() === "") {
				return null;
			}
			metric = metric.trim().toUpperCase();
			if (metric.startsWith("UNT")) {
				metric = metric.substr(3, metric.lenght);
			}
			while (metric.startsWith("0")) {
				metric = metric.substr(1, metric.lenght);
			}
			var metrDef;
			for (var i = 0; i < _custInfos.length; i++) {
				var metrics = _custInfos[i].units;
				for (var j = 0; j < metrics.length; j++) {
					metrDef = _custInfos[i].units[j];
					while (metrDef.startsWith("0")) {
						metrDef = metrDef.substr(1, metrDef.lenght - 1);
					}
					if (metric === metrDef) {
						if (retElement === _CIS_DATA.Title) {
							return _custInfos[i].title;
						} else {
							return _custInfos[i].url;
						}
					}
				}
			} 
			if (retElement === _CIS_DATA.Title) {
				// return a default URL/Title ?
				return this._formatTranslation(	this._translate("i18n>result.engine.defaultTitle.txt"), // =Engine {0}
												metric); 
			} 
			return null;
			// return a default URL?? --> No
		},
		
		//								GenericId	USRC0000000006	true					USRC or ENGC or null
		_getTagTranslation: function (	tag,		innerHtml,		getMulti,	count,		context) {
			// is there a translation for the tag?
			var i;
			var displayText, start, len;
			var transEntry, transTag, transTxt;
			if (tag && tag !== "") {
				if (_translatableTexts && _translatableTexts.length > 0) {
					for (i = 0; i < _translatableTexts.length; i++) {
						transEntry = _translatableTexts[i];
						transTag = transEntry.tag;
						transTxt = transEntry.innerHTML;
						if (transTag && transTag !== "") {
							if ((tag === "Attribute2" || tag === "ATTRIBUTE2") && (!context || context === "")) {
								// debugger;
							}
							if (tag.toUpperCase().startsWith(transTag.toUpperCase())) {
								// If multiple uiTexts exist, find the proper one: by using the firstTagHtml value
								if (transEntry.uiText && typeof transEntry.uiText !== "string") {
									if (transEntry.uiText.length > 0) {
										for (var k=0; k < transEntry.uiText.length; k++) {
											if ( (typeof transEntry.uiText[k].context === 'string' && typeof transEntry.uiText[k].uiText === 'string' && 
													transEntry.uiText[k].context.startsWith(context))
												|| (!context &&  !transEntry.uiText[k].context)) 
											{
												if (getMulti && transEntry.uiText[k].uiTextMulti) {
													displayText = transEntry.uiText[k].uiTextMulti;
												} else {
													displayText = transEntry.uiText[k].uiText;
												}
												displayText = this._translate(displayText);
												// format (replace {0} placeholders with numbers)
												displayText = this._formatTranslation(displayText,	count);
												return displayText;
											} 
										}
										if (!displayText) {
											// no translation found
											// displayText = tag;
											// debugger;
										}
									} else {
										// no translation found
										// displayText = tag;
										// debugger;
									}
									break; 
								} else {
									// check if also the innerHTML must match
									if (transTxt && transTxt !== "") {
										if (innerHtml.toUpperCase().startsWith(transTxt.toUpperCase())) {
											if (getMulti) {
												displayText = transEntry.uiTextMulti;
											} else {
												displayText = transEntry.uiText;
											}
											displayText = this._translate(displayText);
				
											// format (replace {0} placeholders with numbers)
											if (transEntry.number && transEntry.number === "useHtml") {
												start = transTxt.length;
												len = innerHtml.length - start;
												displayText = this._formatTranslation(	displayText,		// e.g. "- Type {0}",
																				innerHtml.substr(start, len)
																			);
											}
											return displayText;
										}
									} else {
										if (getMulti && transEntry.uiTextMulti) {
											displayText = transEntry.uiTextMulti;
										} else {
											displayText = transEntry.uiText;
										}
										displayText = this._translate(displayText);
										displayText = this._formatTranslation(displayText,	count);
										return displayText;
									}
								}
							} // else: nothing to do, for next will try next translation tag
						} else { 
							// no tag provided, so an innerHTML is expected to match
							transTxt = transEntry.innerHTML;
							if (transTxt && transTxt !== "") {
								if (innerHtml.toUpperCase().startsWith(transTxt.toUpperCase())) {
									if (getMulti) {
										displayText = transEntry.uiTextMulti;
									} else {
										displayText = transEntry.uiText;
									}
									displayText = this._translate(displayText);
		
									// format (replace {0} placeholders with numbers)
									if (transEntry.number && transEntry.number === "useHtml") {
										start = transTxt.length;
										len = innerHtml.length - start;
										displayText = this._formatTranslation(	displayText,		// e.g. "- Type {0}",
																		innerHtml.substr(start, len)
																	);
									}
									return displayText;
								}
							} else {
								// debugger;
								// console.log("Entry in tagsTranslations.json file with neither 'tag' nor 'innerHTML' entry");
							}
						} 
					} // else: no translation found, try innerHTML part
				} else {
					return this._translate("i18n>all.unspecified.text");
				}
			} 
			return this._translate("i18n>all.unspecified.text");
		},		
		
		 /* returns a title for a given combination of an engine and a metric number. Accepts 
			engine with leading 0 or ENG(C/S/*) and metric with leading 0 or "UNT" 
		 // File format:	"unitsList": [
								{ "engine": "100",    "units": [ 
            						{ "unit": "50", "unitName": "PA Master Records" }, 
		 */ 		
		
		_formatTranslation: function (text, firstNumStr, secondNumStr, thirdNumStr) {
			var newText = jQuery.sap.formatMessage(text, firstNumStr, secondNumStr, thirdNumStr);
			return newText;
		},
		
		_translate: function (text) {
			if (!text) { 
				return _i18nBundle.getText("all.unspecified.text"); // =[unspecified]
			}
			if (text.startsWith("i18n>")) {
				text = text.substr(5, text.length);
				var translation = _i18nBundle.getText(text);
				if (translation) {
					return translation;
				} else {
					return "[!" + text + "]";
				}
			} else {
				// the text might already be translated, e.g. in the tagsTranslation.json file
				// do NOT REMOVE this part, unless you replace all translations in the tagsTranslation.json with i18n> bundles
				return text;
			}
		},
  
		/* _getTranslationRule: function (tag, text) {
			if (!tag || tag === "") return "";
			if (_translatableTags && _translatableTags.length > 0) {
				for (var i = 0; i < _translatableTags.length; i++) {
					var curEntry = _translatableTags[i];
					var curTag = curEntry.tag;
					if (curTag && curTag !== "") {
						if (tag.toUpperCase().startsWith(curTag.toUpperCase())) {
							if (curEntry.uiText) {
								return curEntry.uiText;
							} else if (curEntry.handlers) {
								if (text && text !== "") {
									for (var j = 0; j < curEntry.handlers.length; j++) {
										var curHandel = curEntry.handlers[j];
										if (text.toUpperCase().startsWith(curHandel.text)) {
											return curHandel;
										}
									} 
									// Tag found but no transation for it, return tag instead
									return tag;
								} else {
									debugger;
									return null;
								}
							} else {
								debugger;
								return null;
							}
						}
					}
				}
			}
			return null;
		}, */

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
			if ("CHK" === type) 	return this._translate("i18n>model.result.checks.CHK.text");
			if ("ENG" === type) 	return this._translate("i18n>model.result.checks.ENG.text");
			if ("USR" === type)	 	return this._translate("i18n>model.result.checks.USR.text");
			return this._translate("i18n>model.result.checks.UNK.text");
		},
				
		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("resultPage").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("[Result page/Part.controller] System number can't be found");
			}
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
				if (curResult) {
					labelUiText = this._getTagTranslation(curResult.tagName, curResult.textContent);
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
		
		// var _POS_RES_VAL = { "GenId": 0, "GenId_F3": 1, "GenId_3": 2, "At1": 3, "At2": 4, "Unit": 5, "PerStart": 6, "PerEnd": 7, "Counter": 8 }; 	// position of various contentText/innerHTML values of the current result 
		/* Loop over the result node and fill an array that holds the values (contentText) of the tags GenericId, Attribute 1/2, Unit, PerStart, PerEnd and Counter. 
		These are used particluarly for later checks. */
		_getResultValueArray: function (curResult) {
			
			var resVal = new Array (_POS_RES_VAL.lenght);
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
 								resVal[_POS_RES_VAL.GenId_F3]	= curResChildTxt.substr(0,3);
 								resVal[_POS_RES_VAL.GenId_F4]	= curResChildTxt.substr(0,4);
 							}
 							if (curResChildTxt.length > 13) {
 								resVal[_POS_RES_VAL.GenId_L2]	= curResChildTxt.substr(12,2);
 								resVal[_POS_RES_VAL.GenId_L4]	= curResChildTxt.substr(10,4);
 							}
							break;
						case "ATTRIBUTE1":
							resVal[_POS_RES_VAL.At1]		= curResChildTxt;
							break;
						case "ATTRIBUTE2":
							resVal[_POS_RES_VAL.At2]		= curResChildTxt;
							break;
						case "UNIT": // get UNIT and (if available) the URL of the customer information sheet via custInfoSheets.json
							resVal[_POS_RES_VAL.Unit]		= curResChildTxt;
							break;
						case "PERSTART":
							if (curResChildTxt.length === 8) {
								monthTxt = curResChildTxt.substr(4,2);
								try {
									monthTxt = MONTHS[Number(monthTxt) - 1];
								} catch (err)	{
									// not a valid number, keep number instread of txt 
								}
								resVal[_POS_RES_VAL.PerStart]	= curResChildTxt.substr(6,2) + " " +  monthTxt + ", " + curResChildTxt.substr(0,4);
							} else {
								resVal[_POS_RES_VAL.PerStart]	= curResChildTxt;
							}
							break;
						case "PEREND":
							if (curResChildTxt.length === 8) {
								monthTxt = curResChildTxt.substr(4,2);
								try {
									monthTxt = MONTHS[Number(monthTxt) - 1];
								} catch (err)	{
									// not a valid number, keep number instread of txt 
								}
								resVal[_POS_RES_VAL.PerEnd]	= curResChildTxt.substr(6,2) + " " +  monthTxt + ", " + curResChildTxt.substr(0,4);
							} else {
								resVal[_POS_RES_VAL.PerEnd]	= curResChildTxt;
							}
							break;
						case "COUNTER":
							resVal[_POS_RES_VAL.Counter]	= curResChildTxt;
							break;
					}
				}
				childLine++;
			}
			
			resVal[_POS_RES_VAL.CisUrl]		= this._getCustInfoSheetData(resVal[_POS_RES_VAL.GenId_L4],	_CIS_DATA.URL);
			resVal[_POS_RES_VAL.CisTitle]	= this._getCustInfoSheetData(resVal[_POS_RES_VAL.GenId_L4],	_CIS_DATA.Title);
			resVal[_POS_RES_VAL.TuUntTitle]	= this._getTuuntText(resVal[_POS_RES_VAL.GenId_L4], resVal[_POS_RES_VAL.Unit]);
			
			return resVal;
		},

		_buildResultList: function (_result) {
			 // no result block available for this part
			if (!_result) { 
				this._renderResultList(null);
				return;
			}
			
			var resElem = 0;
			var codeLine = _result._tagLineStart;			// holds a line counter for the last processed code line 
			var resBlockStartLine = codeLine;				// holds the line number which is used for the first line of the current result block
			// array elements: [0] displayedElement, [1] codeStr, [2] head line

			var resultArray = new Array();					// holds the arrays for all result blocks. 
			var resultElement;								// holds one array of one result block. 
			
			var displayedElements = new Array();				// holds all Controls to be displayed of a result block
			var codeStr = "\t\t<" + _result.tagName + ">\n";	// holds all tag lines for the code editor of a result block; new lines with \n
			codeLine++;

			// var for the loop 
			var curResult,		// holds the current <Result> node
				curResChild,	// holds child nodes of the <Result> node
				// curResChildTxt,	// holds the text content of the curResChild (trimmed, upper case)
				resType,		// holds the ResultType of the current result block
				curResVal, prevResVal, nextResVal,	// three arrays that hold various the tag values of the current / previous / next result
								childLine,		// iterator variable for child elements
				displayTxt, 	// text shown in a result line;
				hasMore,		// does the next result block also belong to this result block;
				title			// temporary variable to hold a title element which needs additional style class
				;
				
			prevResVal = this._getResultValueArray(null); // initialize empty 
			
			// loop over the child nodes of the <part> element (typically one <PartId> and multiple <Result> nodes, of which some belong together)
			while (resElem < _result.children.length) {
				curResult = _result.children[resElem];
				
				// write code lines into codeStr variable for XML editor
				codeStr = codeStr + "\t\t\t" + curResult.outerHTML; 
				if (curResult.childElementCount > 0) {
					codeLine = codeLine + 2 + curResult.childElementCount;
				} else {
					codeLine = codeLine + 1;
				}

				if (curResult.childElementCount == 0) {
					// handle <PartId>1</PartId>
					resType = _RESULT_TYPES.PartId;
					
					title = new Title ({ text: this._translate("i18n>model.parts.part.partId.text"), level: "H3" });
					title.addStyleClass(_TITLE_CSS);
					title.addStyleClass("sapUiTinyMarginTop");
					displayedElements.push(title);
					
					displayedElements.push(
						new ResultLine ({
							label: this._translate("i18n>model.parts.part.partId.text"),
							tag: curResult.nodeName,
							text: curResult.innerHTML,
							skipTopMargin: true}) );	
					resultElement = new Array (displayedElements, codeStr, resBlockStartLine, resType);
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
					if ("USRC" === curResVal[_POS_RES_VAL.GenId_F4]) {
						// is there a next item?
						hasMore = ( curResVal[_POS_RES_VAL.GenId_F4] === nextResVal[_POS_RES_VAL.GenId_F4] && curResVal[_POS_RES_VAL.At2] === nextResVal[_POS_RES_VAL.At2] );

						// If this result block doesn't belong to the previous one, render the introduction lines  
						if ("USRC" !== prevResVal[_POS_RES_VAL.GenId_F4] || curResVal[_POS_RES_VAL.At2] !== prevResVal[_POS_RES_VAL.At2]) {
							displayTxt = this._getTagTranslation(_KNOWN_TAGS.Counter, null, hasMore, curResVal[_POS_RES_VAL.Counter], curResVal[_POS_RES_VAL.GenId_F4]);
							displayedElements.push(
								new ResultLine ({
									title: displayTxt,
									tag: _KNOWN_TAGS.Counter,
									text: curResVal[_POS_RES_VAL.Counter],
									skipTopMargin: false,
									styleSuffix: "2" })  // actually false, but there is line space anyway, so drop it
							);	
						} 

						// in any way, render classification Type 
						// function (tag, innerHtml, getMulti, firstTagHtml, secNum)
						displayTxt = this._getTagTranslation(_KNOWN_TAGS.GenericId, curResVal[_POS_RES_VAL.GenId], hasMore, curResVal[_POS_RES_VAL.Counter], null);
						var translt = this._getTutypText(curResVal[_POS_RES_VAL.GenId_L2]);
						
						displayedElements.push(
								new ResultLine ({
									label:	displayTxt + ": " + translt,
									tag:	_KNOWN_TAGS.GenericId,
									text:	curResVal[_POS_RES_VAL.GenId],
									skipTopMargin: true,
									styleSuffix: "3"}) 
							);	
						
						if (hasMore) {
							prevResVal = curResVal;
							codeStr = codeStr + "\n";
						} else {
							// If the next result block doesn't belong to this result block, render the closding lines
							
							//								GenericId	USRC0000000006	true					USRC or ENGC or null
							// _getTagTranslation: function (	tag,		innerHtml,		getMulti,	count,		context) {
							//  "GenId": 0, "GenId_F3": 1, "GenId_F4": 2, "GenId_L2": 3, "GenId_L4": 4, "At1": 5, "At2": 6, "Unit": 7, "PerStart": 8, "PerEnd": 9, "Counter": 10 }; 	// position of various contentText/innerHTML values of the current result
					
							displayTxt = this._getTagTranslation(_KNOWN_TAGS.Attributes2, null, false, curResVal[_POS_RES_VAL.At2], curResVal[_POS_RES_VAL.GenId_F4]);
							displayedElements.push(
								new ResultLine ({
									label:	displayTxt,
									tag:	_KNOWN_TAGS.Attributes2,
									text:	curResVal[_POS_RES_VAL.At2],
									skipTopMargin: true}) 
							);	
							
							// end result block handling
							resultElement = new Array (displayedElements, codeStr, resBlockStartLine, null);
							resultArray.push(resultElement);
							// reset 
							codeStr = "";
							displayedElements = new Array();
							resBlockStartLine = codeLine;	
						} 
						
					} else if ("ENGC" === curResVal[_POS_RES_VAL.GenId_F4]) {
						// is there a next item?
						hasMore	= false; 
						if  (curResVal[_POS_RES_VAL.CisUrl] && curResVal[_POS_RES_VAL.CisUrl] !== "") {
							hasMore = (curResVal[_POS_RES_VAL.CisUrl] === nextResVal[_POS_RES_VAL.CisUrl]);
						} else {
							hasMore = (curResVal[_POS_RES_VAL.GenId_L4] === nextResVal[_POS_RES_VAL.GenId_L4]);
						}
						
						// Do we have results for a metric with a different Customer information sheet --> Render title + URL als Link
						if ((! curResVal[_POS_RES_VAL.CisUrl] || curResVal[_POS_RES_VAL.CisUrl] === "") && 
								curResVal[_POS_RES_VAL.GenId_L4] !== prevResVal[_POS_RES_VAL.GenId_L4]) {
							title = new Link ({ text: _cis_defaults.engineText, 
														target: "_blank", 
														href: _cis_defaults.enginePage	});
							title.addStyleClass(_TITLE_CSS);							
							title.addStyleClass("sapUiTinyMarginTop");
							displayedElements.push(title);														
						} else if ( (curResVal[_POS_RES_VAL.CisUrl] !== prevResVal[_POS_RES_VAL.CisUrl])) {
							title = new Link ({ 	text: curResVal[_POS_RES_VAL.CisTitle], 
													target: "_blank", 
													href: curResVal[_POS_RES_VAL.CisUrl]	});
							title.addStyleClass(_TITLE_CSS);					
							title.addStyleClass("sapUiTinyMarginTop");
							displayedElements.push(title);
						} 

						// Do we have a new ENGC .... XXXX block? If so, render a headline with the engine number
						if (curResVal[_POS_RES_VAL.GenId] !== prevResVal[_POS_RES_VAL.GenId] ) {
							title = new ClearLine({ style: "elxCL1" }); 
							displayedElements.push(title);			

							displayTxt = this._formatTranslation(
													this._getTuappText(curResVal[_POS_RES_VAL.GenId_L4]),
													curResVal[_POS_RES_VAL.GenId_L4]);
							title = new Label ({ text: displayTxt, design: sap.m.LabelDesign.Bold }); 
							displayedElements.push(title);								
						}	

						// Do we have a different metric? --> render title from TUUNT table
						if (curResVal[_POS_RES_VAL.Unit] !== prevResVal[_POS_RES_VAL.Unit]) {
							title = new ClearLine({ style: "elxCL2" }); 
							displayedElements.push(title);			

							displayTxt = this._getTuuntText(curResVal[_POS_RES_VAL.GenId_L4], curResVal[_POS_RES_VAL.Unit]);
							displayedElements.push(
							new ResultLine ({
								label: displayTxt,
								tag: _KNOWN_TAGS.Unit,
								text: curResVal[_POS_RES_VAL.Unit],
								skipTopMargin: true,
								styleSuffix: "2"
								
							})  // actually false, but there is line space anyway, so drop it
							);
							
							/* title = new Title ({ text: displayTxt, level: "H4" });
							title.addStyleClass(_TITLE_CSS);
							// title.addStyleClass("sapUiTinyMarginTop");
							displayedElements.push(title); */
						}
							
						if ( (curResVal[_POS_RES_VAL.PerStart]	&& curResVal[_POS_RES_VAL.PerStart].trim() !== "") ||
							 (curResVal[_POS_RES_VAL.PerEnd]	&& curResVal[_POS_RES_VAL.PerEnd].trim() !== "") ) {
							displayTxt = this._formatTranslation(	this._translate("i18n>model.result.col.Period.text"), // =From {0} to {1}:
																	curResVal[_POS_RES_VAL.PerStart], curResVal[_POS_RES_VAL.PerEnd]); 
						} else {
							displayTxt = this._translate("i18n>model.result.col.Count.text");
						} 
							
						displayedElements.push(
							new ResultLine ({
								label: displayTxt,
								tag: _KNOWN_TAGS.Counter,
								text: curResVal[_POS_RES_VAL.Counter],
								skipTopMargin: true,
								styleSuffix: "3"})  // actually false, but there is line space anyway, so drop it
						);
						
						if (!hasMore) {
							// end result block handling
							resultElement = new Array (displayedElements, codeStr, resBlockStartLine, null);
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
						hasMore	= false; 
						if  (curResVal[_POS_RES_VAL.CisUrl] && curResVal[_POS_RES_VAL.CisUrl] !== "") {
							hasMore = (curResVal[_POS_RES_VAL.CisUrl] === nextResVal[_POS_RES_VAL.CisUrl]);
						} else {
							hasMore = (curResVal[_POS_RES_VAL.GenId_L4] === nextResVal[_POS_RES_VAL.GenId_L4]);
						}
						
						// Do we have results for a metric with a different Customer information sheet --> Render title + URL als Link
						if ((! curResVal[_POS_RES_VAL.CisUrl] || curResVal[_POS_RES_VAL.CisUrl] === "") && 
								curResVal[_POS_RES_VAL.GenId_L4] !== prevResVal[_POS_RES_VAL.GenId_L4]) {
							/* title = new Link ({ text: _cis_defaults.engineText, 
														target: "_blank", 
														href: _cis_defaults.enginePage	});
							title.addStyleClass(_TITLE_CSS);							
							title.addStyleClass("sapUiTinyMarginTop");
							displayedElements.push(title);	*/
						} else if ( (curResVal[_POS_RES_VAL.CisUrl] !== prevResVal[_POS_RES_VAL.CisUrl])) {
							title = new Link ({ 	text: curResVal[_POS_RES_VAL.CisTitle], 
													target: "_blank", 
													href: curResVal[_POS_RES_VAL.CisUrl]	});
							title.addStyleClass(_TITLE_CSS);					
							title.addStyleClass("sapUiTinyMarginTop");
							displayedElements.push(title);
						} 

						// Do we have a new ENGC .... XXXX block? If so, render a headline with the engine number
						if (curResVal[_POS_RES_VAL.GenId] !== prevResVal[_POS_RES_VAL.GenId] ) {
							title = new ClearLine({ style: "elxCL1" }); 
							displayedElements.push(title);			

							displayTxt = this._formatTranslation(
													this._getTuappText(curResVal[_POS_RES_VAL.GenId_L4]),
													curResVal[_POS_RES_VAL.GenId_L4]);
							title = new Label ({ text: displayTxt, design: sap.m.LabelDesign.Bold }); 
							displayedElements.push(title);								
						}	

						// Do we have a different metric? --> render title from TUUNT table
						if (curResVal[_POS_RES_VAL.Unit] !== prevResVal[_POS_RES_VAL.Unit]) {
							title = new ClearLine({ style: "elxCL2" }); 
							displayedElements.push(title);			

							displayTxt = this._getTuuntText(curResVal[_POS_RES_VAL.GenId_L4], curResVal[_POS_RES_VAL.Unit]);
							displayedElements.push(
							new ResultLine ({
								label: displayTxt,
								tag: _KNOWN_TAGS.Unit,
								text: curResVal[_POS_RES_VAL.Unit],
								skipTopMargin: true,
								styleSuffix: "2"
								
							})  // actually false, but there is line space anyway, so drop it
							);
						}
						
						// Render Attribut1 (Status) value	
						if (curResVal[_POS_RES_VAL.At1] && curResVal[_POS_RES_VAL.At1] !== "") {	
							displayTxt = this._translate("i18n>model.result.col.Attr1.ENGS.text");
							displayTxt = this._formatTranslation(displayTxt, curResVal[_POS_RES_VAL.At1]);
							displayedElements.push(
								new ResultLine ({
									label: displayTxt,
									tag: _KNOWN_TAGS.Attributes1,
									text: curResVal[_POS_RES_VAL.At1],
									skipTopMargin: true,
									styleSuffix: "3"})  // actually false, but there is line space anyway, so drop it
							);
						}
						
						// Render Attribut2 (Batch runtime in sec. ) value
						if (curResVal[_POS_RES_VAL.At2] && curResVal[_POS_RES_VAL.At2] !== "") {
							displayTxt = this._translate("i18n>model.result.col.Attr2.ENGS.text");
							displayTxt = this._formatTranslation(displayTxt, curResVal[_POS_RES_VAL.At2]);
							displayedElements.push(
								new ResultLine ({
									label: displayTxt,
									tag: _KNOWN_TAGS.Attributes2,
									text: curResVal[_POS_RES_VAL.At2],
									skipTopMargin: true,
									styleSuffix: "3"})  // actually false, but there is line space anyway, so drop it
							);
						}

						// Render Counter value
						displayTxt = this._translate("i18n>model.result.col.Count.ENGS.text"); // (obsolete)
						displayedElements.push(
							new ResultLine ({
								label: displayTxt,
								tag: _KNOWN_TAGS.Counter,
								text: curResVal[_POS_RES_VAL.Counter],
								skipTopMargin: true,
								styleSuffix: "3"})  // actually false, but there is line space anyway, so drop it
						);
						
						if (!hasMore) {
							// end result block handling
							resultElement = new Array (displayedElements, codeStr, resBlockStartLine, null);
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
						childLine = 0;
						while (childLine < curResult.childElementCount) {
							curResChild = curResult.children[childLine];
							displayTxt = this._getTagTranslation(curResChild.tagName, curResChild.innerHTML, false, curResChild.innerHTML, curResVal[_POS_RES_VAL.GenId_F4]);
							displayedElements.push(
								new ResultLine ({
								// firstTag: "Result",
								// title: "Key tags in the next <Result> block(s)",
								label: displayTxt,
								tag: curResChild.tagName,
								text: curResChild.innerHTML,
								skipTopMargin: (childLine > 0)}) );	
							childLine++;
						}
						resultElement = new Array (displayedElements, codeStr, resBlockStartLine, null);
						resultArray.push(resultElement);
						// reset 
						codeStr = "";
						displayedElements = new Array();
						resBlockStartLine = codeLine;	
					}
				}
				resElem++;				
			}
			this._renderResultList(resultArray);
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
		_renderResultList: function (resultArray) {
			// console.log("Started building UI ");
			_i18nBundle = this.getView().getModel("i18n").getResourceBundle();
			
			/*	ListBase > growing: works when an items aggregation is bound. 
				ListBase.bindItems(oBindingInfo): Binds aggregation items to model data. See ManagedObject.bindAggregation for a detailed description of the possible properties of oBindingInfo.
			var area = this.oView.byId("dynRestList");
			var items = new ListItemBase(); */
			
			var area = this.oView.byId("dynRestList");
			area.destroyContent(); 
			if (!resultArray || resultArray.length == 0) {
				// there are no results
				var hlTitle = new Title ({ text:  this._translate("i18n>result.noData.text"), level: "H4"  });
				hlTitle.addStyleClass("results");
				area.addContent(hlTitle);
				return;
			} else {
				var hlTitle = new Title ({ text:  this._translate("i18n>model.results.text"), level: "H2"  });
				hlTitle.addStyleClass("results");
				area.addContent(hlTitle);
				
				/* // IDEE: Schreibe, ob alle counter=0 sind und blende diese Elemente per Schalter aus
				var oftb = new sap.m.OverflowToolbar({});
				var tbSp = new sap.m.ToolbarSeparator({});
				var swLb = new Label ({ text: "Show results with value 0"});
				var sw = new sap.m.Switch({
					state: true,
					customTextOn: "Yes",
					customTextOff: "No"
				});
				
				oftb.addContent(hlTitle);
				oftb.addContent(tbSp);
				oftb.addContent(swLb);
				oftb.addContent(sw);
				area.addContent(oftb); */

				/* <Switch state="true" customTextOn="Yes" customTextOff="No">
					<layoutData>
						<FlexItemData growFactor="1" />
					</layoutData>
				</Switch> */
			}
	
			var resItemIdx = 0;
			while (resItemIdx < resultArray.length) {
				/* var headLine = resultArray[resItemIdx][2];
				if (headLine) {
					var hlTitle = new Title ({ text: headLine + " 2", level: "H2"  });
					hlTitle.addStyleClass("results");
					area.addContent(hlTitle);
					hlTitle = new Title ({ text: headLine + " 3", level: "H3"  });
					hlTitle.addStyleClass("results");
					area.addContent(hlTitle);
					hlTitle = new Title ({ text: headLine + " 4", level: "H4"  });
					hlTitle.addStyleClass("results");
					area.addContent(hlTitle);
				} */
				
				var displayedElements = resultArray[resItemIdx][0];
				// var panL = new Panel( { headerText: "Result " + resItemIdx });
				var panL = new VerticalLayout( { width: "100%" }); 
				panL.addStyleClass("sapUiTinyMargin");
				panL.addStyleClass("sapUiNoMarginBottom");
				panL.addStyleClass("lineBefore");
				for (var i = 0; i < displayedElements.length; i++) {
					panL.addContent(displayedElements[i]);
				}
				
				var codeStr = resultArray[resItemIdx][1];
				// var panR = new Panel( { headerText: "XML"});
				var panR = new VerticalLayout( { width: "100%" });
				panR.addStyleClass("sapUiTinyMargin");
				var codeEditor = new CodeEditor(); 
				this.buildEditor (codeStr, codeEditor, resultArray[resItemIdx][2]);
				panR.addContent(codeEditor);
				
				var twoCol = new EqualWidthColumns();
				twoCol.addContent(panL);
				twoCol.addContent(panR);
				/* var nextItem = new CustomListItem (resItemIdx);
				nextItem.addContent(twoCol); */
				area.addContent(twoCol);
				resItemIdx++;
			}

			/* 
			var oList = new List( { id: "dList", width: "100%", growing: true, growingScrollToLoad: true, growingThreshold: 20 } );
			oList.setGrowing(true);
			oList.setGrowingScrollToLoad(true);
			oList.setGrowingThreshold(20); */

			// console.log("Finished building UI ");
		},

		_writeAllResultLines: function (mainArea, _result) {
			mainArea.destroyContent();
			_i18nBundle = this.getView().getModel("i18n").getResourceBundle();
			// _translatableTags = this.getView().getModel("tags").getData().tags; 
			_translatableTexts = this.getView().getModel("tags").getData().texts;
			// _engineNames = this.getView().getModel("engineNames").getData().units;

			// holds the type of the last processed item (Engine, )
			var previousBlockType = "";
			var isFirstInList = false; // skip the padding-top for the first item
			
			var resLine = 0;
			var labelUiText;
			var lastSpecialTag = null;
			var lastSpecialVal = null;		
			var sameResultBlockLines = 1;
			
			
			// ---------- test only -------------------------------
			// remove previous content
			// _resultListArea.destroyContent(); 
			
			/* var _testModelRaw = _result.children[1];
			debugger;
			 _testModelRaw.append(_result.children[2]);
			 _testModelRaw.append(_result.children[3]); 
			// navigate to part branch and extract data
			// set code editor context
			var _oNewEditor = new CodeEditor({ type: "xml"}); //  class="wattEditorContainer"

			// build editor context
			this.buildEditorContext(_testModelRaw, _oNewEditor);
						
			var _oTestEditorPanel = this.oView.byId("testEditor");
			_oTestEditorPanel.addContent(_oNewEditor); */
			// ---------- END test -------------------------------
			

			while (resLine < _result.children.length) {
				var curResult = _result.children[resLine];
				
				if (curResult && curResult.children && curResult.children.length > 0) {
					// Check if the type of result check changed
					var firstTag = curResult.children[0];
					var firstTagTxt = firstTag.innerHTML;
					var firstTagType = this._getBlockType(firstTagTxt);

					// Check if a new Panel-Headline is required (e.g. when Engines block ends and User Checks start)
					if (firstTagType !== previousBlockType) {
						// create a Panel control and add all further result lines of this block to it
						// Tags to be written: <Panel headerText="{i18n>model.result.checks.CHK.text}" 
						//							class="sapUiNoMargin" expandable="true" expanded="true">

						var newTypePanel = new Panel();
						newTypePanel.setHeaderText(this._getPanelText(firstTagType));
						newTypePanel.setExpanded(true);
						newTypePanel.setExpandable(true);
						newTypePanel.addStyleClass("sapUiNoMargin");
						mainArea.addContent(newTypePanel);
						previousBlockType = firstTagType;
						isFirstInList = true;
					}
					
					var tagLine = 0;
					var curTag;
					var curAttribute2Val = null;
					var counterTranslation;
					var hasNextResultBlock;
					
					// loop over the attribues of the <Result> block and handle/display each line
					while (tagLine < curResult.children.length) {
						curTag = curResult.children[tagLine];
						hasNextResultBlock = false;
						
						// Handle special rendering of USRC and ENGC blocks
						if (curTag && curTag.nodeName.toUpperCase().startsWith("GenericId".toUpperCase())) {
							
							// --------- USRC handling ---------------------------------------------------------------------
							if (curTag.innerHTML && curTag.innerHTML.toUpperCase().startsWith("USRC")) {
								
								// get Attribute2 value of the current result
								if (curResult.children[1] && curResult.children[1].nodeName.toUpperCase() === "ATTRIBUTE2") {
									curAttribute2Val = curResult.children[1].innerHTML;
									
									// check if previous result also was 1.) a USRC result and had 2.)  the same Attribute2 value
									if (	!curTag.innerHTML.toUpperCase().startsWith(lastSpecialTag) ||	// 1.) 
											curAttribute2Val !== lastSpecialVal) {							// 2.)
										// if not, render a first line like "7" user classified as:		<Counter>n</>"
										// if (curResult.children[2] !== 'undefined' && curResult.children[2].innerHTML && curResult.children[2].nodeName) {
											counterTranslation = this._getTagTranslation(curResult.children[2].nodeName, curResult.children[2].innerHTML, false, "USRC");
											// format with <Counter> value
											counterTranslation = this._formatTranslation(counterTranslation, curResult.children[2].innerHTML);
											
											labelUiText =  this._getTagTranslation(curResult.nodeName);
											newTypePanel.addContent(
												new ResultLine ({
													// firstTag: "Result",
													// title: "Key tags in the next <Result> block(s)",
													label: labelUiText,
													tag: curResult.nodeName,
													text: "...",
													skipTopMargin: false}));			
											
											// render a first line like "7" user classified as:		<Counter>n</>"
											newTypePanel.addContent(
												new ResultLine ({
													title: counterTranslation,
													//label: counterTranslation,
													tag: curResult.children[2].nodeName,
													text: curResult.children[2].innerHTML,
													skipTopMargin: true}));
										// }
									}
								}
								
								// check if we need the closing block after this result (like 'Result block 1		<Attribute2>1 </>')
								if (		resLine + 1 < _result.children.length && 
											_result.children[resLine + 1]  !== 'undefined' &&
											_result.children[resLine + 1].children  !== 'undefined' &&								// has <result> subnodes
											_result.children[resLine + 1].children[0]  !== 'undefined' &&
											_result.children[resLine + 1].children[0].nodeName.toUpperCase().startsWith("GENERICID") &&
											_result.children[resLine + 1].children[0].innerHTML.toUpperCase().startsWith("USRC") &&
											_result.children[resLine + 1].children[1] !== 'undefined' &&
											_result.children[resLine + 1].children[1].nodeName.toUpperCase().startsWith("ATTRIBUTE2") &&
											_result.children[resLine + 1].children[1].innerHTML === curAttribute2Val 
									) { 
									hasNextResultBlock = true;	
									sameResultBlockLines++;
								} else {
									// debugger;
								}
								
								// render <GenericId> tag
								labelUiText =  this._getTagTranslation(curTag.nodeName, curTag.innerHTML, hasNextResultBlock, "USRC");
								
								newTypePanel.addContent(
									new ResultLine ({
										// title: labelUiText,
										label: labelUiText,
										tag: curTag.tagName,
										text: curTag.innerHTML,
										skipTopMargin: true}));			
												
								// check if we need the closing block after this result (like 'Result block 1		<Attribute2>1 </>')
								if (!hasNextResultBlock) { 
									labelUiText =  this._getTagTranslation(curResult.children[1].nodeName, curResult.children[1].innerHTML, (sameResultBlockLines == 1), "USRC", sameResultBlockLines);
									newTypePanel.addContent(
										new ResultLine ({
											// title: labelUiText,
											label: labelUiText,
											tag: curResult.children[1].nodeName,
											text: curResult.children[1].innerHTML,
											skipTopMargin: true}));
									sameResultBlockLines = 1;
								}
								
								// stop processing the lines of this result, but goto the next result
								lastSpecialTag = "USRC";
								lastSpecialVal = curAttribute2Val;
								break;
							} 
							
							// --------- ENGC handling ---------------------------------------------------------------------
							else if (curTag.innerHTML.toUpperCase().startsWith("ENGC")) {
									newTypePanel.addContent(new Label({ text: "" })); // add an empty label for an empty line
									newTypePanel.addContent(
										 new Link ({ 	text: "0100 - 0120 HR-Personnel Planning and Development (PD)", 
														target: "_blank"
														// href: "https://support.sap.com/content/dam/support/en_us/library/ssp/my-support/systems-installations/system-measurement/engine-self-declaration-product-measurement/0100-0120-sap-human-resource-management-hr-pd-en.pdf" 
													})); 
								// break; // exit the loop over the result lines and process the next result node
																/// DUMMY CODING 
								labelUiText = this._getTagTranslation(curTag.tagName, curTag.innerHTML, false, firstTagTxt);

								newTypePanel.addContent(
									new ResultLine ({
										// title: labelUiText,
										label: labelUiText,
										tag: curTag.tagName,
										text: curTag.innerHTML,
										skipTopMargin: true}));
								tagLine++;
								
							} else {
								
								
								/// DUMMY CODING 
								labelUiText = this._getTagTranslation(curTag.tagName, curTag.innerHTML, false, firstTagTxt);

								newTypePanel.addContent(
									new ResultLine ({
										// title: labelUiText,
										label: labelUiText,
										tag: curTag.tagName,
										text: curTag.innerHTML,
										skipTopMargin: true}));
								tagLine++;
							}
						} else {
							// Handle normal tag - write ResultLine with/without leading margin
							labelUiText = this._getTagTranslation(curTag.tagName, curTag.innerHTML, false, firstTagTxt);

							newTypePanel.addContent(
								new ResultLine ({
									// title: labelUiText,
									label: labelUiText,
									tag: curTag.tagName,
									text: curTag.innerHTML,
									skipTopMargin: true}));
							// var nl = new Label ( { text: "----" } );
							// debugger;
							// newTypePanel.addConent(nl);
							// console.log("--- (1) label=" + labelUiText + "\t +++ tag=" + curTag.tagName + "\t +++ text=" + curTag.innerHTML);
							if (tagLine === 0 && isFirstInList) { 
								isFirstInList = false; 
							}
							tagLine++;
						} // end if-else / tag was not a "GenericId"
					} // loop over tag lines

				// else --> simple tag without child elements. For example the leading <PartId>27</PartId> tag
				} else { 
					if (curResult) {
						labelUiText = this._getTagTranslation(curResult.tagName, curResult.textContent);
						if (typeof labelUiText !== "string") {
							labelUiText = curResult.tagName;
						}
						mainArea.addContent(
							new ResultLine ({
								// title: labelUiText,
								label: labelUiText,
								tag: curResult.tagName,
								text: curResult.innerHTML }) );
						// console.log("--- (2) label=" + labelUiText + "\t +++ tag=" + curResult.tagName, + "\t +++ text=" + curResult.innerHTML);
					}
				}
				
				resLine++;
			}
			mainArea.addContent(newTypePanel);
		},
	
		backToSystem: function (oEvent) {
			var sy = this.sysIdx;
			// debugger;
			this.oRouter.navTo("system", {
				sysIndex: this.sysIdx
			});
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