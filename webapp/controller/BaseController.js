sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/base/Log",
	"../model/formatter"
], function (Controller, UIComponent, JSONModel, MessageToast, Log, formatter) {
	"use strict";

	var _oBundle; // holds the resource bundle for text translation
	// var _blockSelector; // holds the dropdown box
	var _translatableTexts; // holds the set of texts where either 'tag' should  match a tag or a provided text should start with 'innerHTML', or both.
	var _i18nBundle; // holds the resource bundle for text translation

	return Controller.extend("sap.support.zglacelx.Component.controller.BaseController", {
		onInit: function () {

		},

		_xmlModelBranchContains: function (oBranch, sNamedChild) {
			return false;
		},

		_checkInitialModel: function () {
			var that = this;
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var _oModel = that.getOwnerComponent().getModel("userXML");
			if (_oModel.getData()) {
				try {
					if (_oModel.getData().hasChildNodes()) {
						if (_oModel.getData().children[0]._tagDepth === undefined || _oModel.getData().children[0]._tagClass === undefined || _oModel
							.getData()
							.children[0]._tagLineStart === undefined) {
							that._processXML(_oModel.getData());
						}
					} else {
						_oModel.setXML(oStorage.get("xmlLocalStorage"));
						that._processXML(_oModel.getData());
					}
				} catch (err) {
					_oModel.setXML(oStorage.get("xmlLocalStorage"));
					that._processXML(_oModel.getData());
				}
			} else {
				_oModel.setXML(oStorage.get("xmlLocalStorage"));
				that._processXML(_oModel.getData());
			}
		},

		__convertModelToString: function (node) {
			var _retString = "";

			// leaf nodes
			if (!node.children || node.children.length === 0) {
				var _sLTabSpace = "";
				for (var _dCount = 0; _dCount < node._tagDepth; ++_dCount) {
					_sLTabSpace += "    ";
				}

				if (node.textContent != "") {
					_retString = _sLTabSpace + _retString + "<" + node.tagName + ">" + node.textContent + "</" + node.tagName + ">\n";
				} else {
					_retString = _sLTabSpace + _retString + "<" + node.tagName + "/>\n";
				}

				return _retString;
			}
			// parent node
			else if (node.children.length > 0) {
				var _sCTabSpace = "";
				for (var _eCount = 0; _eCount < node._tagDepth; ++_eCount) {
					_sCTabSpace += "    ";
				}
				_retString = _sCTabSpace + "<" + node.tagName + ">\n" + _retString;

				// call all children
				for (var i = 0; i < node.children.length; ++i) {
					_retString += this.__convertModelToString(node.children[i]);
				}

				_retString = _retString + _sCTabSpace + "</" + node.tagName + ">\n";
				return _retString;
			} else {}
		},

		buildEditorContext: function (node, oCodeEditor) {
			return this.buildEditorContextSized(node, oCodeEditor, true);
		},

		buildEditorContextSized: function (node, oCodeEditor, setSize) {
			if (!node) {
				_oBundle = this.getView().getModel("i18n").getResourceBundle();
				oCodeEditor.setValue(_oBundle.getText("part.nodata.text"));
				oCodeEditor.setEditable(false);
				oCodeEditor.setType("xml");
				return;
			}
			var _sXMAS = this.__convertModelToString(node);

			// remove last line break (otherwise we are left with an empty last line)
			_sXMAS = _sXMAS.slice(0, -1);
			oCodeEditor.setMaxLines(100000000);
			this.buildEditorSized(_sXMAS, oCodeEditor, node._tagLineStart, setSize);
		},

		buildEditor: function (codeStr, oCodeEditor, firstLineNumber) {
			return this.buildEditorSized(codeStr, oCodeEditor, firstLineNumber, true);
		},

		buildEditorSized: function (codeStr, oCodeEditor, firstLineNumber, setSize) {
			if (!codeStr) {
				_oBundle = this.getView().getModel("i18n").getResourceBundle();
				oCodeEditor.setValue(_oBundle.getText("part.nodata.text"));
				oCodeEditor.setEditable(false);
				oCodeEditor.setType("xml");
				return;
			}

			// WARNING: This is a direct call to the ACE settings and might break
			// if the ACE interface changes. Reference:
			// https://github.com/ajaxorg/ace/wiki/Configuring-Ace#session-options
			// set maxLines to a very large numbers to prevent scroll bars
			if (setSize) {
				oCodeEditor._oEditor.setOptions({
					firstLineNumber: firstLineNumber,
					maxLines: 100000000
				});
			} else {
				oCodeEditor._oEditor.setOptions({
					firstLineNumber: firstLineNumber,
					minLines: 5,
					scrollPastEnd: 0.5
				});
			}
			oCodeEditor.setValue(codeStr);
			oCodeEditor.setEditable(false);
			oCodeEditor.setType("xml");
		},

		_getCorrespondingSystem: function (iPartIndex) {
			var tModel = this.getOwnerComponent().getModel("userXML");
			var _iSysNo = tModel.getProperty("/Parts/Part/" + iPartIndex + "/SystemNo");
			var systems = tModel.getData().children[0]._tagMeasurementSystemsHook.children;
			for (var i = 0; i < systems.length; ++i) {
				if (systems[i].children[0].textContent === _iSysNo) {
					return i;
				}
			}

			// if no system was found return -1
			return -1;
		},

		_getCorrespondingResultIndex: function (iPartIndex) {
			if (!this.isValidPartIndx(iPartIndex)) {
				return -1;
			}
			var _iPartId = this.getOwnerComponent().getModel("userXML").getProperty("/Parts/Part/" + iPartIndex + "/PartId").trim();
			// console.log("  Search for PartId " + _iPartId);
			var results = this._oModel.getData().children[0]._tagMeasurementResultsHook.children;
			for (var i = 0; i < results.length; ++i) {
				var resPartId = results[i].children[0].textContent.trim();
				// console.log("  Test " + resPartId + " === " + _iPartId);
				if (resPartId === _iPartId) {
					return i;
				}
			}
			// if no result was found (can happen), so return -1
			return -1;
		},

		storeLocalRawXML: function (oData) {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			oStorage.put("xmlLocalStorage", oData);
		},

		_processXML: function (node) {
			var that = this;
			that._processXMLElement(node, 0, -2);
		},

		_processXMLElement: function (node, lastPos, lastDepth) {
			// leaf node
			var that = this;
			if (node.children && node.children.length === 0) {
				node._tagLineStart = lastPos + 1;
				node._tagLineEnd = node._tagLineStart;
				node._tagClass = "leaf";
				node._tagDepth = lastDepth + 1; // we do not want to return this change						
				if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Header") {
					node._tagMetaBlockAssociationName = "Header";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Systems") {
					node._tagMetaBlockAssociationName = "Systems";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Parts") {
					node._tagMetaBlockAssociationName = "Parts";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Results") {
					node._tagMetaBlockAssociationName = "Results";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				}
				return {
					lPos: node._tagLineStart,
					lDepth: lastDepth
				};
			}
			// parent node
			else if (node.children && node.children.length > 0) {
				// MISSING: _tagLineEnd
				node._tagLineStart = lastPos + 1;
				node._tagDepth = lastDepth + 1;
				node._tagClass = "parent";
				// identify Measurement block
				if (node.tagName === "Measurement" && node.parentNode.parentNode === null) {
					node._tagMetaBlockAssociationName = "Measurement";
					node._tagMetaBlockAssociationHook = node;

					// set hooks to components if available
					for (var k = 0; k < node.children.length; ++k) {
						switch (node.children[k].tagName) {
						case "Header":
							node._tagMeasurementHeaderHook = node.children[k];
							break;
						case "Systems":
							node._tagMeasurementSystemsHook = node.children[k];
							break;
						case "Parts":
							node._tagMeasurementPartsHook = node.children[k];
							break;
						case "Results":
							node._tagMeasurementResultsHook = node.children[k];
							break;
						}
					}
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Measurement" && node.tagName === "Header") {
					node._tagMetaBlockAssociationName = "Header";
					node._tagMetaBlockAssociationHook = node;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Measurement" && node.tagName === "Systems") {
					node._tagMetaBlockAssociationName = "Systems";
					node._tagMetaBlockAssociationHook = node;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Measurement" && node.tagName === "Parts") {
					node._tagMetaBlockAssociationName = "Parts";
					node._tagMetaBlockAssociationHook = node;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Measurement" && node.tagName === "Results") {
					node._tagMetaBlockAssociationName = "Results";
					node._tagMetaBlockAssociationHook = node;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Header") {
					node._tagMetaBlockAssociationName = "Header";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Systems") {
					node._tagMetaBlockAssociationName = "Systems";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Parts") {
					node._tagMetaBlockAssociationName = "Parts";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Results") {
					node._tagMetaBlockAssociationName = "Results";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else {
					node._tagMetaBlockAssociationName = "invalid";
				}

				// initial values
				var _oCallValues = {};
				_oCallValues.lPos = node._tagLineStart;
				_oCallValues.lDepth = node._tagDepth;

				// call all children
				for (var i = 0; i < node.children.length; ++i) {
					_oCallValues = that._processXMLElement(node.children[i], _oCallValues.lPos, _oCallValues.lDepth);
				}

				// increase line position and ajdust its value in _oCallValues
				_oCallValues.lPos++;
				_oCallValues.lDepth = lastDepth;

				return _oCallValues;
			}
		},

		onDropDownSelect: function (oEvent) {
			this._resultSelected = null;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			// console.log("Dropdown selected") ;
			var selKey = oEvent.getParameter('selectedItem').getKey();
			if (selKey === "header") {
				this.resetResultSelection();
				oRouter.navTo("header");
			} else if (selKey.startsWith("system/")) {
				this.resetResultSelection();
				oRouter.navTo("system", {
					sysIndex: selKey.substr("system/".length, selKey.length)
				});
			} else if (selKey.startsWith("part/")) {
				this.resetResultSelection();
				this.navigateToPartIndex(selKey.substr("part/".length, selKey.length));
			} else if (selKey.startsWith("resultid/")) {
				this._resultSelected = selKey;
				// console.log("Set Result selection in drop down to " + selKey);
				this.navigateToResultIndex(selKey.substr("resultid/".length, selKey.length));
			} else {
				// unexpected element in drop down list!
			}
		},

		resetResultSelection: function () {
			this._resultSelected = null;
			// console.log("Reset Result selection in drop down");
		},

		_getCodeSelector: function (oBlockSelector, selectedKey, selectedResult) { // _mainModelRaw = this._oModel.getData().children[0];
			_oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var _mainModelRaw = this._oModel.getData().children[0];

			if (oBlockSelector != null && oBlockSelector.getItems() != null && oBlockSelector.getItems().length > 0) {
				oBlockSelector.removeAllItems();
			}

			//  do not use this caching as it failed to be reseted in the Intro.controller method resetXmlBlockSelectors
			/* try {
				if (oBlockSelector != null && oBlockSelector.getItems() != null && oBlockSelector.getItems().length > 0) {							
					if (selectedKey && selectedKey != "") {
						oBlockSelector.setSelectedKey(selectedKey);
						if (this._resultSelected && selectedResult !== "resultid/-1") {
							oBlockSelector.setSelectedKey(selectedResult);
							// console.log("Selected existing, selected result " + selectedResult);
						} else {
							// console.log("Selected existing, selected " + selectedKey);
						}						
					} else {
						// console.log("No selected dropdown key");
					}
					return oBlockSelector;
				}
			} catch (err) {
				// not properly initialized, will be done now
			} */

			// oBlockSelector = new sap.m.Select("blockSelector");
			oBlockSelector.setShowSecondaryValues(true);

			var nextItem, mainText, addText, i;

			/* xml.dropdown.header.text=Header
			xml.dropdown.system.text=System {0}
			xml.dropdown.part.text=Part {0}
			xml.dropdown.result.text=Result {0}
			xml.dropdown.line.text=Line {0} */

			// get numeric value of selectedKey (if there is such one, otherwise -1)
			var selectedKeyNumber = -1;
			try {
				selectedKeyNumber = parseInt(selectedKey.substring(selectedKey.indexOf("/") + 1, selectedKey.length));
			} catch (err) {
				// if no number is contained, an exception is raised which can be ignored 
			}
			var selectedResultNumber = -1;
			try {
				selectedResultNumber = parseInt(selectedResult.substring(selectedResult.indexOf("/") + 1, selectedResult.length));
			} catch (err) {
				// if no number is contained, an exception is raised which can be ignored 
			}

			// build Header entry
			mainText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.line.text"), _mainModelRaw._tagMeasurementHeaderHook._tagLineStart);
			addText = _oBundle.getText("xml.dropdown.header.text");
			if (selectedKey === "header") {
				nextItem = new sap.ui.core.ListItem({
					key: "header",
					text: mainText + " / " + addText,
					additionalText: addText
				});
			} else {
				nextItem = new sap.ui.core.ListItem({
					key: "header",
					text: mainText,
					additionalText: addText
				});
			}
			oBlockSelector.addItem(nextItem);

			// build System entries
			if (_mainModelRaw._tagMeasurementSystemsHook) {
				for (i = 0; i < _mainModelRaw._tagMeasurementSystemsHook.childElementCount; i++) {
					mainText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.line.text"), _mainModelRaw._tagMeasurementSystemsHook.children[
						i]._tagLineStart);
					addText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.system.text"), i);
					if (selectedKey.startsWith("system") && selectedKeyNumber == i) {
						nextItem = new sap.ui.core.ListItem({
							key: "system/" + i,
							text: mainText + " / " + addText,
							additionalText: addText
						});
					} else {
						nextItem = new sap.ui.core.ListItem({
							key: "system/" + i,
							text: mainText,
							additionalText: addText
						});
					}
					oBlockSelector.addItem(nextItem);
				}
			}

			// build Part entries
			if (_mainModelRaw._tagMeasurementPartsHook) {
				for (i = 0; i < _mainModelRaw._tagMeasurementPartsHook.childElementCount; i++) {
					mainText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.line.text"), _mainModelRaw._tagMeasurementPartsHook.children[i]
						._tagLineStart);
					addText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.part.text"), i);
					if (selectedKey.startsWith("part") && selectedKeyNumber == i) {
						nextItem = new sap.ui.core.ListItem({
							key: "part/" + i,
							text: mainText + " / " + addText,
							additionalText: addText
						});
					} else {
						nextItem = new sap.ui.core.ListItem({
							key: "part/" + i,
							text: mainText,
							additionalText: addText
						});
					}
					oBlockSelector.addItem(nextItem);
				}
			}

			// build result entries
			if (_mainModelRaw._tagMeasurementResultsHook) {
				for (i = 0; i < _mainModelRaw._tagMeasurementResultsHook.childElementCount; i++) {
					mainText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.line.text"), _mainModelRaw._tagMeasurementResultsHook.children[
						i]._tagLineStart);
					addText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.result.text"), i);
					if (this._resultSelected && selectedResultNumber == i) {
						nextItem = new sap.ui.core.ListItem({
							key: "resultid/" + i,
							text: mainText + " / " + addText,
							additionalText: addText
						});
					} else {
						nextItem = new sap.ui.core.ListItem({
							key: "resultid/" + i,
							text: mainText,
							additionalText: addText
						});
					}
					oBlockSelector.addItem(nextItem);
				}
			}

			if (selectedKey && selectedKey != "") {
				oBlockSelector.setSelectedKey(selectedKey);
				if (this._resultSelected && selectedResult !== "resultid/-1") {
					oBlockSelector.setSelectedKey(selectedResult);
					// console.log("Selected existing, selected result " + selectedResult);
				} else {
					// console.log("Selected existing, selected " + selectedKey);
				}
				// console.log("Selected " + selectedKey);
			} else {
				// console.log("No selected dropdown key");
			}
			return oBlockSelector;

		},

		/* returns a title for a given combination of an engine and a metric number. Accepts 
			engine with leading 0 or ENG(C/S/*) and metric with leading 0 or "UNT" 
		 // File format:	"unitsList": [
								{ "engine": "100",    "units": [ 
            						{ "unit": "50", "unitName": "PA Master Records" }, 
		 */
		//								GenericId	USRC0000000006	true					USRC or ENGC or null
		_getTagTranslation: function (tag, innerHtml, getMulti, count, context) {
			_translatableTexts = this.getOwnerComponent().getModel("trans").getData().trans;

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
										for (var k = 0; k < transEntry.uiText.length; k++) {
											if ((typeof transEntry.uiText[k].context === 'string' && typeof transEntry.uiText[k].uiText === 'string' &&
													transEntry.uiText[k].context.startsWith(context)) || (!context && !transEntry.uiText[k].context)) {
												if (getMulti && transEntry.uiText[k].uiTextMulti) {
													displayText = transEntry.uiText[k].uiTextMulti;
												} else {
													displayText = transEntry.uiText[k].uiText;
												}
												displayText = this._translate(displayText);
												// format (replace {0} placeholders with numbers)
												displayText = this._formatTranslation(displayText, count);
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
												displayText = this._formatTranslation(displayText, // e.g. "- Type {0}",
													innerHtml.substr(start, len)
												);
											} else if (transEntry.number && transEntry.number === "formatTime") {
												count = formatter.formatTime(count);
												displayText = this._formatTranslation(
													displayText,
													count);
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
										displayText = this._formatTranslation(displayText, count);
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
										displayText = this._formatTranslation(displayText, // e.g. "- Type {0}",
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

		_translate: function (text) {
			_i18nBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

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

		_formatTranslation: function (text, firstNumStr, secondNumStr, thirdNumStr) {
			var newText = jQuery.sap.formatMessage(text, firstNumStr, secondNumStr, thirdNumStr);
			return newText;
		},

		/* Checks if the provided partIndx is in the range between 0 and the number of entries in the <Parts> block
		returns true or false; */
		isValidPartIndx: function (partIndx) {
			if (this.getOwnerComponent().getModel("userXML")) {
				if (partIndx >= 0 && partIndx < this.getOwnerComponent().getModel("userXML").getData().children[0]._tagMeasurementPartsHook.childElementCount) {
					return true;
				}
			}
			return false;
		},

		/* Calls getIdsForPartIndex and navigates to Part.view to show the corresponding part (and result if available) */
		navigateToPartIndex: function (partIndx) {
			var target = this._getIdsForPartIndex(partIndx);
			if (target[0] != -1 && target[1] != -1) {
				this.oRouter.navTo("part", {
					sysIndex: target[0],
					partIndex: target[1],
				});
			} else {
				// navigate to an error page with the option to navigate to the Elements.view
			}

		},

		/* In the <Parts> block at position specified by variable partIndx, a part should exist. The corresponding PartId
		and the SystemNo can directly be read there. The index (sysIndx) in the <Systems> block can be determined via the 
		SystemNo value. It is required for the navigation (which requires sysIndx and partIndx). 
		
		returns an int array [sysIndex, partIndex]; -1 indicates that a value was not found
		*/
		_getIdsForPartIndex: function (partIndx) {
			if (!this.isValidPartIndx || !this.getOwnerComponent().getModel("userXML")) {
				return [-1, -1];
			}
			var sysNo = this.getOwnerComponent().getModel("userXML").getProperty("/Parts/Part/" + partIndx + "/SystemNo").trim();
			// now loop over <Systems> block to find matching SystemNo to get the systemIndex
			// get the part index corresponding to the ResultId (= Part Id)

			var oSystems = this.getOwnerComponent().getModel("userXML").getObject("/Systems");
			var curSyst, curSystChild;
			var sysIdx = -1; // used as flag for abort
			if (oSystems && oSystems.childElementCount > 0) {
				oSystems = oSystems.children;
				for (var si = 0; si < oSystems.length; si++) {
					curSyst = oSystems[si];
					if (curSyst && curSyst.childElementCount > 0) {
						for (var sj = 0; sj < curSyst.childElementCount; sj++) {
							curSystChild = curSyst.children[sj];
							if (curSystChild && curSystChild.tagName.toUpperCase() === "SYSTEMNO") {
								// console.log ("SystemNo " + curSystChild.innerHTML.trim() + " ?= " + sysNo);
								if (curSystChild && curSystChild.innerHTML.trim() === sysNo) {
									// console.log(" ------------ found ! -----------");
									sysIdx = si;
									break;
								} else {
									break; // this System has a different SystemNo, try next one
								}
							}
						}
						if (sysIdx > -1) {
							this.sysIdx = si;
							this.partIdx = partIndx;
							break;
						}
					}
				}
			}
			if (sysIdx == -1) {
				var msg = this.getView().getModel("i18n").getResourceBundle().getText("resultid.exception.NoSuchSystemNo.text"); // =No system found with SystemNo {0}.
				msg = jQuery.sap.formatMessage(msg, this.resultId);
				sap.m.MessageToast.show(msg);
			}

			return [sysIdx, partIndx];
		},

		navigateToResultIndex: function (resIndx) {
			var _mainModelRaw = this._oModel.getData().children[0];
			// get the result at position resIndx and read its PartId
			var partIndxStr = this._oModel.getData().children[0]._tagMeasurementResultsHook.children[resIndx].children[0].innerHTML.trim();
			var partIndx = Number.parseInt(partIndxStr);

			// loop over the Parts and get SystemNo
			var oParts = this._oModel.getData().children[0]._tagMeasurementPartsHook;
			var curPart, curPartChild, curPartId, sysNo, sysIdx, isRightPart;

			if (oParts && oParts.childElementCount > 0) {
				// loop over the parts and check which part has a matching PartId
				for (var curPartIndx = 0; curPartIndx < oParts.childElementCount; curPartIndx++) {
					var curPart = oParts.children[curPartIndx];
					isRightPart = false;

					// first loop: check if PartId matches
					for (var j = 0; j < curPart.childElementCount; j++) {
						curPartChild = curPart.children[j];
						if (curPartChild && curPartChild.tagName.toUpperCase() === "PARTID" && curPartChild.innerHTML) {
							curPartId = curPartChild.innerHTML.trim();
							if (curPartId === partIndxStr) {
								isRightPart = true;
							}
							break;
						}
					}

					if (isRightPart) {
						break;
					}
				}
				if (isRightPart) {
					this.navigateToPartIndex(curPartIndx);
				} else {
					// no Part found with a matching PartId 
				}
			} // else: no Parts 
		}

	});
});