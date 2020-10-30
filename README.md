# LAW result file app

## Description
When you've completed an [SAP system measurement](https://support.sap.com/en/my-support/systems-installations/system-measurement.html), this project helps you to understand the XML content of the result file created by the SAP License Administration Workbench (LAW). You can run this sample code either online in the SAP ONE Support Launchpad (https://zglacelx-supportportal.dispatcher.hana.ondemand.com/, S-user required) or download and run it locally in your own UI5 environment.

## Requirements
To run the app, you need a HTTP webserver, UI5 (either SAP UI5 or openUI5) and a copy of this sample code.

## Download and Installation
There are many ways to run this sample code. We describe two options in more details here:

### Option 1: Run the app in your own SAP WebIDE
This option is the easiest, as you just have to clone the sample code into your workspace. 

#### Step 1: Clone GitHub repository
Open your WebIDE and right-click your workspace. Select the option **_Git > Clone Repository_**.
<br />![](https://github.com/SAP-samples/law-result-file/blob/main/pic-install/option1_WebIDE/img01_Clone-repository.png?raw=true "Screenshot Clone github repository")
<br /><br />Enter the URL https://github.com/SAP-samples/law-result-file.git and press **_Clone_**.
<br />![](https://github.com/SAP-samples/law-result-file/blob/main/pic-install/option1_WebIDE/img02_Enter-repository-URL.png?raw=true "Screenshot Enter repository URL")
<br /><br />You may be asked for user authentication on GitHub. If the Git Ignore System Files dialog pops up, press **_Commit and Push_**. A **_Clone completed_** confirmation should show up.

#### Step 2: Start the app
After the repository is cloned, open the project folder and the **_webapp_** subfolder. 
Right-Click the file **_index.html_** file in there and choose **_Run > Run index.html_**.
<br />![](https://github.com/SAP-samples/law-result-file/blob/main/pic-install/option1_WebIDE/img03_Run-index.html.png?raw=true "Screenshot Run app/sample code")
<br /><br />A new tab/window opens displaying the app
<br />![](https://github.com/SAP-samples/law-result-file/blob/main/pic-install/img01_StartedApp.png?raw=true "Screenshot Started App")

### Option 2: Download the app and run it on a web server/in your dev. environment (e.g. in Visual Studio Code)
For this option, you need a HTTP web server (we use the one in Visual Studio Code in this example), the sample code and UI5.

#### Step 1: Create a folder for the sample code
If you follow this example and use _Visual Studio Code_'s web server, you can create a folder practically anywhere on your disk. If you use a different web server, the folder may have to be in a specific location (see the manual of your web server). In this example, we create the folder **_github_law_result_file_**. 
<br />![](https://github.com/SAP-samples/law-result-file/blob/main/pic-install/option2_WebServer-VisualStudioCode/Step01_Download-Sample-Code.png?raw=true "Screenshot Repository_download")
<br />

#### Step 2: Get the law-result-file sample code
Use the green **_Code > Download ZIP_** button above to download the sample code of this github repository. Save it and extract it in the **_github_law_result_file_** folder, which will create a subfolder **_law-result-file-main_** with the files from the repository in it.

#### Step 3: Get the UI5 libraries
Download the openUI5 libraries from https://openui5.org/releases/. The sample code has been tested with the **_runtime_** version 1.82.1 (https://github.com/SAP/openui5/releases/download/1.82.1/openui5-runtime-1.82.1.zip). Save it and extract it to the **_law-result-file-main_** folder, so that the _resources_ folder of the .zip file becomes a subfolder of the _law-result-file-main_ folder.
<br />![](https://github.com/SAP-samples/law-result-file/blob/main/pic-install/option2_WebServer-VisualStudioCode/Step02_Screenshot_Subfolder.png?raw=true "Screenshot Folder Content")

#### Step 4: Open the app
To run the app, open the **_index.html_** file from the **_webapps_** subfolder. You can do this e.g. with an IDE like Visual Studio Code (https://code.visualstudio.com/). When you start Visual Studio Code, use menu **_File > Open Folder_** and open the folder **_law-result-file-main_**. 
<br />![](https://github.com/SAP-samples/law-result-file/blob/main/pic-install/option2_WebServer-VisualStudioCode/Step03_VSC_Open_Folder.png?raw=true "Screenshot VSC Open folder")
<br /><br />Open the _webapp_ subfolder and right-click the **_index.html_** file. Select **_Open with Live Server_**.
<br />![](https://github.com/SAP-samples/law-result-file/blob/main/pic-install/option2_WebServer-VisualStudioCode/Step04_VSC_Open_with_Live_Server.png?raw=true "Screenshot VSC Open folder")
<br /><br />A new browser window opens displaying the app
<br />![](https://github.com/SAP-samples/law-result-file/blob/main/pic-install/img01_StartedApp.png?raw=true "Screenshot Enter repository URL")

## Known Issues
There are no known issues at this time.

## How to obtain support
This project is provided "as-is": there is no guarantee that raised issues will be answered or addressed in future releases. If you have any topics, you may discuss them with your SAP license audit contact or you can create a [ticket](https://github.com/SAP-samples/law-result-file/issues/new).
Further information is available at https://support.sap.com/en/my-support/systems-installations/system-measurement.html.

## Contributing
Currently this project is only being updated and maintained by SAP employees.

## License
Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSES/Apache-2.0.txt) file.

## REUSE Badge
[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/law-result-file)](https://api.reuse.software/info/github.com/SAP-samples/law-result-file)
