sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/resource/ResourceModel",
	"sap/base/i18n/ResourceBundle",
	"sap/base/Log",
	"../../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	".././layout/EqualWidthColumns",
	".././layout/ResultLine",
	"sap/m/Label",
	"sap/m/Panel",
	"sap/m/Link",
], function (BaseController, JSONModel, XMLView, ResourceModel, ResourceBundle, Log, formatter, Filter, FilterOperator, 
				EqualWidthColumns, ResultLine, Label, Panel, Link) {
	"use strict";
	
	var _oBundle; // holds the resource bundle for text translation
	var _translatableTags;	// holds the set of tags with 'tag' and 'trans' attributes from the tagsTranslation.json file;
							// 'tags' list XML tags from LAW which needs to be explaned, 'trans' the corresponding translation
							// example: tag <PerStart> will be replaced by "from" for the description part
							
	var _translatableTexts;	// holds the set of texts with 'innerHTML' and 'trans' attributes from the tagsTranslation.json file;
							// 'innerHTML' list XML text from LAW which needs to be explaned, 'trans' the corresponding translation 							
							// example: text 
	var _engineNames;		// is an copy of the TUUNT table in JSON format which holds the texts for the engine IDs. 
							// In contrast to the LAW results, Ids are provided here without leading 0s.

	return BaseController.extend("glacelx.glacelx.controller.part.Results", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var route = oRouter.getRoute("part");
			
			this._oModel = this.getOwnerComponent().getModel("userXML");
			this._checkInitialModel();
			
			route.attachMatched(this._onRouteMatched, this);
			var tabs = this.getView().byId("iconTabBar");
		},

		valueCheck: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
		},

		_onRouteMatched: function (oEvent) {
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
			var oForm = this.oView.byId("selectedResult");
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
			// oForm = this.oView.byId("resultTable");

			// navigate to part branch and extract data
			var _mainModelRaw = this._oModel.getData().children[0];
			var _part = _mainModelRaw._tagMeasurementResultsHook.children[resultIdx];
			
			// debugger;
			// set code editor context
			var _oSysCodeEditor = this.oView.byId("resultsCE");
			// build editor context
			this.buildEditorContext(_part, _oSysCodeEditor);
			
			var _resultListArea = this.oView.byId("resultList");
			// $.sap.require(".././layout/ResultLine");
			this._writeAllResultLines(_resultListArea, _part);
		},
		
		_writeAllResultLines: function (mainArea, _part) {
			_oBundle = this.getView().getModel("i18n").getResourceBundle();
			_translatableTags = this.getView().getModel("tags").getData().tags; 
			_translatableTexts = this.getView().getModel("tags").getData().texts;
			_engineNames = this.getView().getModel("engineNames").getData().units;

			// holds the type of the last processed item (Engine, )
			var previousBlockType = "";
			var isFirstInList = false; // skip the padding-top for the first item
			
			var resLine = 1;
			var labelUiText;
			var lastSpecialTag = null;
			var lastSpecialVal = null;		
			var sameResultBlockLines = 1;

			while (resLine < _part.children.length && resLine < 30) {
				var curResult = _part.children[resLine];
				
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
											counterTranslation = this._getTranslation(curResult.children[2].nodeName, curResult.children[2].innerHTML, false, "USRC");
											// format with <Counter> value
											counterTranslation = this._formatTranslation(counterTranslation, curResult.children[2].innerHTML);
											
											labelUiText =  this._getTranslation(curResult.nodeName);
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
								if (		resLine + 1 < _part.children.length && 
											_part.children[resLine + 1]  !== 'undefined' &&
											_part.children[resLine + 1].children  !== 'undefined' &&								// has <result> subnodes
											_part.children[resLine + 1].children[0]  !== 'undefined' &&
											_part.children[resLine + 1].children[0].nodeName.toUpperCase().startsWith("GENERICID") &&
											_part.children[resLine + 1].children[0].innerHTML.toUpperCase().startsWith("USRC") &&
											_part.children[resLine + 1].children[1] !== 'undefined' &&
											_part.children[resLine + 1].children[1].nodeName.toUpperCase().startsWith("ATTRIBUTE2") &&
											_part.children[resLine + 1].children[1].innerHTML === curAttribute2Val 
									) { 
									hasNextResultBlock = true;	
									sameResultBlockLines++;
								} else {
									// debugger;
								}
								
								// render <GenericId> tag
								labelUiText =  this._getTranslation(curTag.nodeName, curTag.innerHTML, hasNextResultBlock, "USRC");
								
								newTypePanel.addContent(
									new ResultLine ({
										// title: labelUiText,
										label: labelUiText,
										tag: curTag.tagName,
										text: curTag.innerHTML,
										skipTopMargin: true}));			
												
								// check if we need the closing block after this result (like 'Result block 1		<Attribute2>1 </>')
								if (!hasNextResultBlock) { 
									labelUiText =  this._getTranslation(curResult.children[1].nodeName, curResult.children[1].innerHTML, (sameResultBlockLines == 1), "USRC", sameResultBlockLines);
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
									newTypePanel.addContent(
										 new Link ({ 	text: "0100 - 0120 HR-Personnel Planning and Development (PD)", 
														target: "_blank" 
														// href: "https://support.sap.com/content/dam/support/en_us/library/ssp/my-support/systems-installations/system-measurement/engine-self-declaration-product-measurement/0100-0120-sap-human-resource-management-hr-pd-en.pdf" 
													})); 
								// break; // exit the loop over the result lines and process the next result node
																/// DUMMY CODING 
								labelUiText = this._getTranslation(curTag.tagName, curTag.innerHTML, false, firstTagTxt);

								newTypePanel.addContent(
									new ResultLine ({
										// title: labelUiText,
										label: labelUiText,
										tag: curTag.tagName,
										text: curTag.innerHTML,
										skipTopMargin: isFirstInList}));
								tagLine++;
								
							} else {
								
								
								/// DUMMY CODING 
								labelUiText = this._getTranslation(curTag.tagName, curTag.innerHTML, false, firstTagTxt);

								newTypePanel.addContent(
									new ResultLine ({
										// title: labelUiText,
										label: labelUiText,
										tag: curTag.tagName,
										text: curTag.innerHTML,
										skipTopMargin: isFirstInList}));
								tagLine++;
							}
						} else {
							// Handle normal tag - write ResultLine with/without leading margin
							labelUiText = this._getTranslation(curTag.tagName, curTag.innerHTML, false, firstTagTxt);

							newTypePanel.addContent(
								new ResultLine ({
									// title: labelUiText,
									label: labelUiText,
									tag: curTag.tagName,
									text: curTag.innerHTML,
									skipTopMargin: !isFirstInList}));
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
						labelUiText = this._getTranslation(curResult.tagName, curResult.textContent);
						if (typeof labelUiText !== "string") {
							// debugger;
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
		*/
		_getTranslation: function (tag, innerHtml, getMulti, firstTagHtml, secNum) {
			// is there a translation for the tag?
			var i;
			var displayText;
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
											/* if (typeof transEntry.uiText[k].firstHMTL === 'string' && 
												typeof transEntry.uiText[k].uiText === 'string'&& 
												typeof firstTagHtml === 'string') { */
												if (firstTagHtml.toUpperCase().startsWith(transEntry.uiText[k].firstHTML.toUpperCase())) {
													var displayText = transEntry.uiText[k].uiText;
													uiText = displayText;
													break;
												}
											// }
										}
									}
								} else {
									if (getMulti && transEntry.uiTextMulti) {
										displayText = transEntry.uiTextMulti;
									} else {
										displayText = transEntry.uiText;
									}
								}
								
								// @TODO: add translation HERE via ResourceBundle if i18n used in tagsTranlations.json
								
								if (transEntry.number && transEntry.number === "useValue" ) {
									return this._formatTranslation(	displayText,	// e.g. '{0} users classified as",
																	innerHtml,		// e.g. 8 from <Counter>8</Counter>
																	secNum			// used for Attribute2
																);
								}
								return transEntry.uiText;
							}
						}
					}
				}
			} 
			// is there a translation for the innerHTML?
			if (!innerHtml || innerHtml === "") {
				return "";
			}
	
			if (_translatableTexts && _translatableTexts.length > 0) {
				var uiText;
				for (i = 0; i < _translatableTexts.length; i++) {
					transEntry = _translatableTexts[i];
					var curText = transEntry.innerHTML;
					if (curText && curText !== "") {
						if (innerHtml.toUpperCase().startsWith(curText.toUpperCase())) {
							if (getMulti) {
								// @TODO: add translation via ResourceBundle if i18n used in tagsTranlations.json
								uiText = transEntry.uiTextMulti;
							} else {
								// @TODO: add translation via ResourceBundle if i18n used in tagsTranlations.json
								uiText = transEntry.uiText;
							}
							// format string / replace {0} by values
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
			return "";
		},
		
		_formatTranslation: function (text, numberStr, secNum) {
			var newText = jQuery.sap.formatMessage(text, numberStr, secNum);
			return newText;
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
									// debugger;
									return null;
								}
							} else {
								// debugger;
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
			if ("CHK" === type) 	return _oBundle.getText("model.result.checks.CHK.text");
			if ("ENG" === type) 	return _oBundle.getText("model.result.checks.ENG.text");
			if ("USR" === type)	 	return _oBundle.getText("model.result.checks.USR.text");
			return _oBundle.getText("model.result.checks.UNK.text");
		},
		
		/* replaces the tag by an explanation text if there is one for that text 
			for example: */
/*		_getExplanationText: function (tag, content) {
			if (!tag || tag === "") { return tag; }
			if (!content || content === "") { return tag; }
			
			for (var i = 0; i < _translatableTags.length; ++i) {
				var found = _translatableTags[i].tag;
				if (content.toUpperCase() === _translatableTags[i].tag) {
					return _translatableTags[i].trans;
				}
			}
			// no translation text found
			return tag;
		},*/
		
		/* _getNonEmptyResultColumns: function (iPartIndex) {
			var results = this._oModel.getData().children[0]._tagMeasurementResultsHook.children;
			var corRes = results[iPartIndex];
			
			// loop over children
			for (var i = 0; i < corRes.children.length; ++i) {
				var nextNode = corRes.children[i];
				var nodeName = nextNode.nodeName;
				if (nodeName) {
					if (nodeName.trim().toLowerCase() === "result") {
						console.log(nextNode.children);
					}
					// ignore tags different from 'Result', particularly the 'PartId' tag
				}
			}
			// if no system was found return -1
			return -1;
		}, */		

		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("selectedResult").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("System number can't be found");
			}
		}
	});
});