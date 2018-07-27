var create = (function(){

  return {

    addAuthor: (function(entry){
      var _block = {"name": ""};
      entry.push(_block);
      return entry;
    }),

    addBlock: (function(entry, blockType, pc){
      try{
        if(pc !== null){
          if(blockType === "measurement"){
            var _crumbs = "";
            _crumbs = pc + "0" + blockType;
          } else if (blockType === "summary"){
            _crumbs = pc + "0model0" + blockType;
          }
          // measurement tables
          if (blockType === "measurement"){
            entry["measurementTable"] = create.addTable(entry["measurementTable"], _crumbs);
          }
          // model tables
          else if (["summary", "ensemble", "distribution"].indexOf(blockType) !== -1){
            create.prepModelTable(entry, blockType, function(entry2){
              if (blockType === "summary"){
                entry2["model"][0]["summaryTable"] = create.addTable(entry2.model[0].summaryTable, _crumbs);
              } else if (blockType === "distribution"){
                entry2["model"][0]["distributionTable"] = create.addTable(entry2.model[0].distributionTable, _crumbs);
              } else if (blockType === "ensemble"){
                entry2["model"][0]["ensembleTable"] = create.addTable(entry2.model[0].ensembleTable, _crumbs);
              }
              return entry2;
            });
          }
        } else {
          // This is a block that doesn't require a "paleo" or "chron" designation
          if(blockType === "funding"){
            entry = create.addFunding(entry);
          } else if (blockType === "pub"){
            entry = create.addPublication(entry);
          } else if (blockType === "author"){
            entry = create.addAuthor(entry);
          } else if (blockType === "column"){
            entry = create.addTableColumn(entry);
          } else if (blockType === "geo"){
            entry = create.addGeo(entry);
          }
        }
        return entry;
      } catch (err){
       console.log("Error: create:addBlock: " + err);
      }
    }),

    addChronData :(function(entry, blockType){
      if(blockType === "measurement"){
        entry.chronData = [
          {"measurementTable": [{"tableName": "chron0measurement0", "filename": "chron0measurement0.csv"}]}];
      } else if (blockType === "summary"){
        entry.chronData = [
          {"model": [{"summaryTable": [{"tableName": "chron0model0summary0", "filename": "chron0model0summary0.csv"}], "method":{}}]}];
      }
      return entry;
    }),

    // addDataSetName: (function(_dsn, _csv){
    //   // Check if the datasetname is in the CSV filenames or not.
    //   for (var _key in _csv){
    //     if(_csv.hasOwnProperty(_key)){
    //       // if the datasetname exists in this csv file.
    //       if(_key.indexOf(_dsn) !== -1){
    //         // don't need to add a datasetname. We found it.
    //         return false;
    //       }
    //     }
    //   }
    //   // no datasetname found. We need to add them throughout the JSON data and _csv names.
    //   return true;
    // }),

    addFunding: (function(entry){
      var _block = {"agency": "", "grant": "", "investigator": "", "country": ""};
      if (!entry){
        entry = [];
      }
      entry.push(_block);
      return entry;
    }),

    addPublication: (function(entry){
      var _block = {"identifier": [{ "type": "doi", "id": "", "url": "" }], "title": "", "year":"", "journal": "",
                  "issue":"", "edition": "", "volume":"", "author": [{"name": ""}] };
      entry.push(_block);
      return entry;
    }),

    addRmProperty: (function(entry, field){
      try{
        if (entry.hasOwnProperty(field)){
          delete entry[field];
        } else {
          entry[field] = "";
        }
      } catch(err) {
        console.log("create: addRemoveField: " + err);
      }
      return entry;
    }),

    addTable: (function(entry, crumbs){
      try{
        if(typeof(entry)=== "undefined"){
          entry = [];
        }
        // Add a full data table to an entry.
        _tn = crumbs + entry.length;
        _csv = crumbs + entry.length + ".csv";
        entry.push({"tableName": _tn, "filename": _csv, "columns": []});
        return entry;
      } catch(err){
        console.log("addTable: " + err);
        console.log(entry);
      }
    }),

    addTableColumn: (function(entry){
      // Our new column number is one higher than the amount of columns we currently have.
      var _number = entry.length + 1;
      var _block = {"number": _number,"variableName": "", "description": "", "units": "", "values": ""};
      entry.push(_block);
      return entry;
    }),

    /**
     * Add the required column keys to each column if they don't exist.
     *
     * @param {Array} D Metadata
     * @param {Array} fields Field names (strings) to be added to columns
     * @return {Array} D Metadata, with new fields added
     */
    addFieldsToCols: (function(D, fields, cb){
      var _pcs = ["paleoData", "chronData"];

      // We don't need to add the root fields, because those are already standard.

      for (var _u=0; _u < _pcs.length; _u++){
        var _pc = _pcs[_u];
        if(D.hasOwnProperty(_pc)){
          var _section = D[_pc];
          for(var _s=0; _s < _section.length; _s++){
            if(_section[_s].hasOwnProperty("measurementTable")){
              D[_pc][_s]["measurementTable"] = create.addFieldsToTables(_section[_s]["measurementTable"], fields);
            }
            if(_section[_s].hasOwnProperty("model")){
              D[_pc][_s]["model"] = create.addFieldsToModels(_section[_s]["model"], fields);
            }
          }
        }
      }

      cb(D);
    }),

    /**
     * Add the required column keys to each column if they don't exist.
     *
     * @param {Array} models Metadata
     * @param {Array} fields Field names (strings) to be added to columns
     * @return {Array} models Metadata
     */
    addFieldsToModels: (function(models, fields){
      for(var _p = 0; _p <models.length; _p++){
        var _model = models[_p];
        if (_model.hasOwnProperty("summaryTable")){
          models[_p]["summaryTable"] = create.addFieldsToTables(models[_p]["summaryTable"], fields);

        }
        if (_model.hasOwnProperty("ensembleTable")){
          models[_p]["ensembleTable"] = create.addFieldsToTables(models[_p]["ensembleTable"], fields);
        }
      }
      return(models);
    }),

    /**
     * Add the required column keys to each column if they don't exist.
     *
     * @param {Array} tables Metadata
     * @param {Array} fields Field names (strings) to be added to columns
     * @return {Array} tables Metadata
     */
    addFieldsToTables: (function(tables, fields){
      for(var _t = 0; _t<tables.length; _t++){
        tables[_t] = create.addFieldsToTable(tables[_t], fields);
      }
      return(tables);
    }),

    /**
     * Add the required column keys to each column if they don't exist.
     *
     * @param {Array} tables Metadata
     * @param {Array} fields Field names (strings) to be added to columns
     * @return {Array} tables Metadata
     */
    addFieldsToTable: (function(table, fields){
        var _columns = table["columns"];
        for(var _c = 0; _c < _columns.length; _c++){
          for (var _k = 0; _k < fields.length; _k++){
            var _key = fields[_k];
            if(!_columns[_c].hasOwnProperty(_key)){
              table["columns"][_c][_key] = "";
            }
          }
        }
      return(table);
    }),

    alterFilenames: (function(_scopeFiles){
      var _dsn = _scopeFiles.dataSetName;
      _scopeFiles.csv = create.alterCsvFilenames(_scopeFiles.csv, _dsn);
      _scopeFiles.json = create.alterJsonFilenames(_scopeFiles.json, _dsn);
      return _scopeFiles;
    }),

    alterCsvFilenames: (function(_csv, _dsn){
      var _csvCopy = {};
      // change all the csv filenames in the csv metadata
      for (var _key in _csv){
        if (_csv.hasOwnProperty(_key)){
          if(_key.indexOf(_dsn) === -1){
            _csvCopy[_dsn + "." + _key]  = _csv[_key];
          } else {
            _csvCopy[_key] = _csv[_key];
          }
        }
      }
      return(_csvCopy);
    }),

    alterJsonFilenames: (function(x, dsn){
      // Recursive: find any filename entries and append the datasetname to the front of it.

      // loop over this data structure
      for (var _key in x){
        // safety check: don't want prototype attributes
        if (x.hasOwnProperty(_key) && x[_key] !== undefined){
          // found a filename entry. change it.
          if(_key === "filename"){
            if(x[_key].indexOf(dsn) === -1) {
              x[_key] = dsn + "." + x[_key];
            }
          } else if (x[_key].constructor === [].constructor && x[_key].length > 0) {
            // value is an array. iterate over array and recursive call
            for (var _g=0; _g < x[_key].length; _g++){
              // process, then return in place.
              x[_key][_g] = create.alterJsonFilenames(x[_key][_g], dsn);
            }
          } else if (x[_key].constructor === {}.constructor && x[_key].length > 0){
            x[_key] = create.alterJsonFilenames(x[_key], dsn);
          }
        }
      }
      return x;
    }),

    /**
     * Wrapper for multiple closing functions before initiating a file download
     *
     * For example: removing temporary fields, fixing filenames, and moving data around.
     *
     */
    closingWorkflow: (function(_scopeFiles, _dsn, _csv){
      // Remove temporary fields from the JSON data
      var _scopeFilesCopy = JSON.parse(JSON.stringify(_scopeFiles));
      // TODO copy the archiveType from the root, to each data table column
      _scopeFilesCopy.json = create.rmTmpEmptyData(_scopeFilesCopy.json);
      // Prepend DSN to CSV filenames wherever necessary. Do this for _csv metadata data and _json metadata.
      _scopeFilesCopy = create.alterFilenames(_scopeFilesCopy);
      return _scopeFilesCopy;
    }),

    closingWorkflowNoaa: (function(_scopeFiles, _dsn, _csv, cb){
      var _newScopeFiles = create.closingWorkflow(_scopeFiles, _dsn, _csv);
      var _newCsv = create.structureCsvForPy(_newScopeFiles.csv, _dsn);
      cb({"metadata": _newScopeFiles.json, "csvs": _newCsv});
    }),

    turnOffToggles: (function(_x, toggle_key){
      // Turn off all Toggles (recursive) beneath the given level.
      try{
        for (var _key in _x) {
          // safety check: don't want prototype attributes
          if (_x.hasOwnProperty(_key)) {
            // if this key is in the array of items to be removed, then remove it.
            if (_key === toggle_key) {
              // remove this key
              _x[_key] = false;
            } // if key in removables
            else if (_x[_key].constructor === [].constructor) {
              // value is an array. iterate over array and recursive call
              for (var _g = 0; _g < _x[_key].length; _g++) {
                // process, then return in place.
                _x[_key][_g] = create.turnOffToggles(_x[_key][_g], toggle_key);
              }
            } // if array
            else if (_x[_key].constructor === {}.constructor) {
              _x[_key] = create.turnOffToggles(_x[_key], toggle_key);
            } // if object
          } // hasownproperty
        }
      } catch (err){
        console.log(err);
      }
      return _x;
    }),

    getParsedCsvObj: (function(csv_name, csv_objs){
      var _csv_obj = {};
      var _found = false;

      // Loop over all the csv filenames
      for (var _filename in csv_objs){
        if(csv_objs.hasOwnProperty(_filename)){
          // Is this csv_name in the current filename?
          // (ie. is "paleo0measurement0.csv" within "Heiser2018.paleo0measurement0.csv". Yes. )
          if(_filename.indexOf(csv_name) !== -1){
            // Swap and use the new filename match
            csv_name = _filename;
            // Also get the object for this filename
            _csv_obj = csv_objs[_filename];
            _found = true;
          }
        }
      }

      // If a sub match wasn't found, then check for an exact match. (We prefer a sub-match)
      if(!_found){
        if(csv_objs.hasOwnProperty(csv_name)){
          _csv_obj = csv_objs[csv_name];
        }
      }

      return {"name": csv_name, "data": _csv_obj};
    }),


    initColumnTmp: (function(x){
      // Tmp Data throughout page:
      // Table level: {"tmp": {"toggle": bool, "parse": bool, "graphActive": bool}
      // Model Table Method: {"tmp": {"toggle": bool}}
      // Column Level: {"tmp": {"toggle": bool}}

      // when uploading a file, we need to add in the column property booleans for the "Add Properties" section of each
      // column. That way, an uploaded file that already has properties from our list will trigger the checkbox to be on.
      var _ignore = ["values", "variableName", "units", "number"];
      // loop over this data structure
      try{
        // Loop for n amount of unknown keys
        for (var _key in x){
          if (x.hasOwnProperty(_key) && x[_key] !== undefined){

            // Are we at table level? We'll know based on if columns are present.
            if(_key === "columns"){
              x["tmp"] = {};
              // X is currently a data table. Set the toggle
              x["tmp"] = {"toggle": false, "parse": true, "toggleGraph": false};
              // loop for each column
              for (var _v = 0; _v < x.columns.length; _v++){
                var _col = x.columns[_v];
                // Create the tmp object in each column
                x.columns[_v].tmp = {"toggle": false, "toggleGraph": false, "toggleGraphDisabled": false};
                // loop for each property in one column
                for (var _prop in _col){
                  if (_col.hasOwnProperty(_prop) && _col[_prop] !== undefined){
                    // console.log(_prop);
                    if(!_ignore.includes(_prop)){
                      // console.log("adding prop");
                      _col.tmp[_prop] = true;
                    }
                  }
                }
                // console.log(_col);
              }
              // console.log(_x);
            }

            if(x[_key]){
              // Check if this is a nested structure and we need to process deeper.
              if (x[_key].constructor === [].constructor && x[_key].length > 0) {
                // value is an array. iterate over array and recursive call
                for (var _g=0; _g < x[_key].length; _g++){
                  // process, then return in place.
                  x[_key][_g] = create.initColumnTmp(x[_key][_g]);
                }
              } else if (x[_key].constructor === {}.constructor && x[_key].length > 0){
                x[_key] = create.initColumnTmp(x[_key]);
              }
            }
          }
        }
      } catch (err){
        console.log(err);
      }
      return x;
    }),

    // When a LiPD file is uploaded, it needs an Array for these fields. Empty or not. If missing, put in empty arrays. 
    initMissingArrs: (function(x){
      var currKey = "";
      var keys = ["pub", "funding", "chronData", "paleoData"];
      for (var key in keys){
        try {
          currKey = keys[key];
          if(!x.hasOwnProperty(currKey)){
             x[currKey] = [];
          } else {
            if(x[currKey] === 'undefined' || !x[currKey]){
              x[currKey] = [];
            }
          }
        } catch (err){
          console.log("initMissingArrs: " + err);
        }
      }
      return x;
    }),

    rmTmpEmptyData: (function(x){
      // We add a few temporary variables (toggle, column values) when creating the page.
      // However, these cannot end up in the final lipd file. remove them.
      var _removables = ["toggle", "values", "tmp", "showColumn"];
      try{
        for (var _key in x){
          // safety check: don't want prototype attributes
          if (x.hasOwnProperty(_key)){
            if(x[_key]){
              if (typeof(x[_key]) === "string" && !x[_key]){
                delete x[_key];
              } // if string
              // if this key is in the array of items to be removed, then remove it.
              else if(_removables.includes(_key)){
                // remove this key
                delete x[_key];
              } // if key in removables
              else if (x[_key].constructor === [].constructor) {
                // value is an array. iterate over array and recursive call
                if (x[_key].length === 0){
                  delete x[_key];
                } else {
                  for (var _g=0; _g < x[_key].length; _g++){
                    // process, then return in place.
                    x[_key][_g] = create.rmTmpEmptyData(x[_key][_g]);
                  }
                }
              } // if array
              else if (x[_key].constructor === {}.constructor){
                if (JSON.stringify(x[_key]) === JSON.stringify({})){
                  delete x[_key];
                } else {
                  x[_key] = create.rmTmpEmptyData(x[_key]);
                }
              } // if object
            }
          } // hasownproperty
        } // for key in object
      } catch (err){
        console.log(err);
      }
      return x;
    }),

    rmBlock: (function(entry, idx){
      if (idx > -1) {
          entry.splice(idx, 1);
      }
      return entry;
    }),

    sortDoiResponse: (function(res, entry){
      var _keys = {
        "citation": "citation",
        "created": "year",
        "container-title": "journal",
        "author": "authors",
        "publisher": "publisher",
        "title": "title",
        "type": "type",
        "volume": "volume",
        "issue": "issue",
        "page": "pages",
        "abstract": "abstract"
      };
      //do some stuff and put res data into the entry.
      for (var _key in _keys) {
        try{
          if (_keys.hasOwnProperty(_key) && res.data.hasOwnProperty(_key)) {
            if (res.data[_key]){
              if (_key === "created"){
                // get the year from the created attribute
                entry.year = res.data.created["date-parts"][0][0];
              } else if (_key === "author"){
                // loop over and sort through the author names
                var _auths = [];
                var _currAuth = "";
                // Loop over the authors data in the response object
                for(var _i = 0; _i < res.data.author.length; _i++){
                  // put together the string for this one author
                  _currAuth = res.data.author[_i].family  + ", " + res.data.author[_i].given;
                  // push this author into the array in BibJson fashion
                  _auths.push({"name": _currAuth});
                }
                // set the authors array to the entry data
                entry.author = _auths;
              } else {
                // normal case: create new key in entry, and set the value using the respoonse object data.
                entry[_keys[_key]] = res.data[_key];
              }
            } // end if undefined
          } // end if hasOwnProperty
        } catch(err){
          console.log(err);
        }
      } // end for loop
      return entry;
    }),

    structureCsvForPy: (function(_csv, _dsn){
      var _newCsv = {};
      for(var _filename in _csv){
        if(_csv.hasOwnProperty(_filename)){
          _newCsv[_filename] = _csv[_filename]["transposed"];
        }
      }
      return _newCsv;
    }),

    updateCsvScope: (function(_scope_vals, _csv){

      if(Object.keys(_scope_vals).length === 0 && _scope_vals.constructor === Object){
        // No old data to update. The new data can be used as-is.
        return _csv;
      } else {
        // Theoretically, these should have the same number of rows, but if for some reason the new data has more rows,
        // then just use that instead.
        if (_scope_vals.rows <= _csv.rows) {
          _scope_vals.rows = _csv.rows;
        }
        // All the other metadata needs to be updated or replaced.
        _scope_vals.cols = _scope_vals.cols + _csv.cols;
        _scope_vals.errors = _scope_vals.errors.concat(_csv.errors);
        _scope_vals.meta = _csv.meta;
        _scope_vals.delimiter = _csv.delimiter;
        _scope_vals.transposed = _scope_vals.transposed.concat(_csv.transposed);
        // All data row arrays need to have the new columns concatenated onto the end.
        for(var _i = 0; _i < _scope_vals.data.length; _i++){
          _scope_vals.data[_i] = _scope_vals.data[_i].concat(_csv.data[_i]);
        }
      }
      // Our new scope data is finished and ready to replace the old scope.
      return _scope_vals;
    }),

    // STORED DATA LISTS -----


    inType: (function(str, entry){

        // We want entry types that match the str given. ie. "Class", "NamedIndividual", etc
        if(entry.hasOwnProperty("@type")){
            // @type could be an array or a single string
            if(Array.isArray(entry["@type"])){
                // Loop over array
                for(var _p=0; _p<entry["@type"].length; _p++){
                    var _currString = entry["@type"][_p];
                    // Is the substring in this @type entry?
                    if(_currString.indexOf(str) !== -1){
                        // It's here. We're done.
                        return true;
                    }
                }
            }
            // @type is a single string entry
            else {
                // Is the substring in this @type entry?
                if(entry["@type"].indexOf(str) !== -1){
                    // It's here. We're done.
                    return true;
                }

            }
        }
        return false;
    }),

    archiveTypeList: (function(){

        var _archiveTypes = [];
        var _ontology = create.ontology();

        for(var _m=0; _m < _ontology["@graph"].length; _m++){
            var _entry = _ontology["@graph"][_m];
            if(create.inType("Class", _ontology["@graph"][_m])){
                if(_entry.hasOwnProperty("rdfs:subClassOf")){
                    if(_entry["rdfs:subClassOf"].hasOwnProperty("@id")){
                        if(_entry["rdfs:subClassOf"]["@id"] === "http://linked.earth/ontology#ProxyArchive"){
                            _archiveTypes.push(_entry["rdfs:label"]["@value"]);
                        }
                    }
                }
            }
        }

        return _archiveTypes;
    }),

    createdByList: (function(){
      return ["excel", "lipd.net", "wiki", "noaa", "unknown"];
    }),

    defaultColumnFields: (function(){
      return ["proxy", "measurementMaterial", "method", "sensorSpecies", "sensorGenus", "variableType",
        "proxyObservationType", "notes", "inferredVariableType", "takenAtDepth"];
    }),

    fieldsList: (function(){
      return [
        { id: 1, name: "calibration"},
        { id: 2, name: "hasResolution"},
        { id: 3, name: "inferredVariableType"},
        { id: 4, name: "interpretation"},
        { id: 5, name: "measurementMaterial"},
        { id: 6, name: "method"},
        { id: 7, name: "notes"},
        { id: 8, name: "physicalSample"},
        { id: 9, name: "proxy"},
        { id: 10, name: "proxyObservationType"},
        { id: 11, name: "sensorGenus"},
        { id: 12, name: "sensorSpecies"},
        { id: 13, name: "takenAtDepth"},
        { id: 14, name: "variableType"},
      ]
    }),

    tourSteps: (function(){
      return [
        {
          element:document.querySelector(".step0"),
          intro: "Welcome to the Create LiPD page! This tour is designed to teach you the ins and outs of creating or " +
          "editing a LiPD file. We tried to make working with LiPD data as simple as possible, but some parts of the process " +
          "inevitably need more explanation. Don't forget to hover your mouse pointer on items throughout the page to see more hints. "
        },
        {
          // Map
          element: document.querySelector(".step1"),
          intro: "Use the map to verify the location for the dataset. A pin drops on the map using the coordinate data. Use the graph to plot a simple line graph with the values from your data tables."
        },
        {
          // Choose file button
          element: document.querySelector(".step2"),
          intro: "If you have a LiPD file you want to upload, you can do that here. If not, that's okay too! Use the fields to start building a LiPD file",
          position: 'right'
        },
        {
          // Validate button
          element: document.querySelector(".step3"),
          intro: 'LiPD files must abide by a set of standards for key names, data structure, minimum data thresholds, etc. to be considered a valid file. The validation process gives you feedback on how to make your data a valid LiPD file.',
          position: 'right'
        },
        {
          // Save Session button
          element: document.querySelector(".step4"),
          intro: "Need a break from your dataset? Did your internet connection disconnect? Save the session and come back later. Just don't close your internet browser! We'll offer to load an older session if we find one saved in the browser.",
          position: 'right'
        },
        {
          // Download lipd button
          element: document.querySelector(".step5"),
          intro: 'Download your validated data as a LiPD file to your local computer.',
          position: "right"
        },
        {
          // Download NOAA button
          element: document.querySelector(".step6"),
          intro: "Download your validated data as a NOAA template text file. Please note, one text file is created for every paleo measurement table in your dataset. A multi-file output is downloaded as a ZIP file.",
          position: "right"
        },
        {
          // NOAA ready, wiki ready switches
          element: document.querySelector(".step7"),
          intro: "The LinkedEarth Wiki and NOAA have additional data requirements to the LiPD requirements. Turning on these switches will add custom data input fields to the page and add rules to the validation process.",
          position: "right"
        },
        {
          // Feedback boxes
          element: document.querySelector(".step8"),
          intro: "Validation results. Every time you press the 'Validate' button, these boxes will show the results. Warnings are recommended fixes, but not required. Errors MUST be fixed.",
          position: "right"
        },
        {
          // Requirements boxes
          element: document.querySelector(".step9"),
          intro: "The requirements boxes give you feedback on how complete your dataset is and if you meet different levels of requirements. Hover your mouse pointer over each box to view specific requirements for each.",
          position: "right"
        },
        {
          // Files list
          element: document.querySelector(".step10"),
          intro: "All files ( .jsonld, .csv, .txt ) archived withing the LiPD file are listed here after upload. The filenames listed may be clicked to view the contents inside.",
          position: "right"
        },
        {
          // Root data - disabled fields and asterisks
          element: document.querySelector(".step11"),
          intro: "Fields with a dashed underline are disabled. If you see one, it is done intentionally to preserve standardization and the field will be automatically populated for you. Fields with an asterisk (*) are required fields.",
          position: "left"
        },
        {
          // NOAA Specific
          element: document.querySelector(".step12"),
          intro: "The section for NOAA specific data is hidden until you flip the switch for 'NOAA Ready (Beta)'",
          position: "left"
        },
        {
          // Funding - Multiple entry sections
          element: document.querySelector(".step13"),
          intro: "Sections with an 'Add+' button allow for multiple entries that expand and collapse. (You can try this during the tour!) Click '- Delete' to delete a specific entry. ",
          position: "left"
        },
        {
          // Publication
          element: document.querySelector(".step14"),
          intro: "'Autocomplete using DOI' is the important part of the publication section. When you enter a DOI (Digital Object Identifier) and click the button, we'll use doi.org to retrieve and fill the publication data for you as much as possible. Authors are stored as individual entries according to BibJson standard. .",
          position: "left"
        },
        {
          // Geo
          element: document.querySelector(".step15"),
          intro: "LiPD stores coordinates as Decimal Degrees, but you may enter your coordinates in Degrees-Minutes-Seconds or Decimal Degrees. Use the switch to change modes. The other fields are standard. ",
          position: "left"
        },
        {
          // Paleo
          element: document.querySelector(".step16"),
          intro: "Add values to your tables via the Spreadsheet (Beta) or Classic parser. The Spreadsheet is similar to a normal Excel spreadsheet. However, please note that if you enter data and you don't see the changes, please click 'Refresh' to update the view. When using the Classic parser, copy/paste your values into the box and choose the parsing options. We recommend using the Spreadsheet unless you are experiencing issues with it.",
          position: "top"
        },
        // {
        //   // Delimiter
        //   element: document.querySelector(".step17"),
        //   intro: "Choose the delimiter that matches what you see in the input box below. One exception: When copying data from a spreadsheet, the delimiter is 'Tab (\\t)'.",
        //   position: "right"
        // },
        // {
        //   // Parse Mode
        //   element: document.querySelector(".step18"),
        //   intro: "The parse box has multiple modes attached to it. Choose the one that fits your situation. 'Start New' builds a brand new table. 'Update' keeps all existing column metadata, and replaces all column values. 'Add' keeps all existing columns and adds the parsed values as new columns to the table  ",
        //   position: "right"
        // },
        // {
        //   // Header
        //   element: document.querySelector(".step19"),
        //   intro: "Header row data will parse into the 'variableName' field for each column. Please note, units will not be parsed from the header row.",
        //   position: "right"
        // },
        // {
        //   // Parse Values Box
        //   element: document.querySelector(".step20"),
        //   intro: "Here's an example of some data with a header line. This is what the data would look like if you copied it from a spreadsheet and it had a 'Tab' delimiter. Click 'Parse Values' to see how it creates columns in this table.",
        //   position: "top"
        // },
        // {
        //   // Add table dropdown and button
        //   element: document.querySelector(".step21"),
        //   intro: "Add a new data table to paleoData or chronData by choosing the table type from the dropdown menu and clicking '+ Add Table'. We're working to add support for more tables!",
        //   position: "top"
        // },
        {
          // Delete Section buttons
          element: document.querySelector(".step22"),
          intro: "If you want to remove and ENTIRE paleoData section or chronData section, their respective 'Delete' buttons will do that. There's a confirmation box that asks you if you're sure before deleting the data.",
          position: "top"
        },
        {
          // chronData
          element: document.querySelector(".step23"),
          intro: "The chronData section is identical to everything you've seen in the paleoData section, so I'll skip this section of the page.",
          position: "top"
        },
        {
          element: document.querySelector(".step24"),
          intro: "That's it! There many different pieces to this page, but hopefully this tour has explained some of the initial questions and the process makes more sense.",
        },


      ]
    }),

    inferredVariableTypeList: (function(){
      return ['Temperature', 'Sea Surface Temperature', 'Bottom Water Temperature', 'Ocean Mixed Layer Temperature',
      'Surface air temperature', 'Carbon dioxide concentration', 'Methane concentration', 'Nitrous oxide concentration',
      'Free oxygen levels', 'pH', 'Carbonate saturation', 'Carbonate Ion Concentration', 'Salinity',
        'Precipitation Amount', 'd18O', 'dD', 'ExcessD', 'Moisture Content', 'PDSI', 'Year', 'JulianDay',
      'Age', 'Radiocarbon Age', 'SOI', 'Nino3.4', 'Nino3', 'Nino4', 'Nino1', 'Nino2', 'Nino1+2', 'AMO', 'NAO', 'AO',
      'SAM', 'AAO'];
    }),

    interpretationLocalList: (function(){
      return ["local", "far-field"];
    }),

    interpretationDirectionList: (function(){
      return ["positive", "negative"];
    }),

    interpretationScopeList: (function(){
      return ["climate", "ecology", "isotope"];
    }),

    prepModelTable: (function(entry, blockType, cb){
      try{

        if(typeof entry === "undefined"){
          entry = {};
        }
        if(entry.hasOwnProperty("model")){
          if(typeof entry["model"][0][blockType + "Table"] === "undefined"){
            entry["model"][0][blockType] = [];
          }
        }
        // model doesnt exist. create it
        else {
          entry["model"] = [{"summaryTable": [], "ensembleTable": [], "distributionTable": [], "method": {}}];
        }
        cb(entry);
      } catch(err){
        console.log("Error: create: prepModelTable: " + err);
        console.log(entry);
      }
    }),

    proxyObservationTypeList: (function(){
      return ['Al/Ca', 'Ar-Ar', 'B/Ca', 'Ba/Ca', 'C', 'Clay fraction', 'Color', 'd34S', 'd13C', 'd15N', 'd17O', 'd18O',
      'dD', 'Density', 'Diffuse spectral reflectance', 'Faunal', 'Fe/Ca', 'Floral', 'Grain size', 'Historic',
      'Layer thickness', 'Lead Isotope', 'Li/Ca', 'Lithics', 'Luminescence', 'Magnetic susceptibility', 'Mg/Ca',
      'Mineral matter', 'Mn/Ca', 'Moisture Content', 'N', 'Neodymium', 'Organic matter', 'P', 'Permeability',
      'Porosity', 'Radiocarbon', 'Resistivity', 'Sand fraction', 'Si', 'Silt fraction', 'Sr/Ca', 'TEX86', 'U-Th',
      'Uk37', 'X-Ray diffraction', 'X-ray fluorescence', 'Zn/Ca'];
    }),

    timeUnitList: (function(){
      return ["AD", "BP", "CE"];
    }),

    fieldMetadataLibrary: (function(section, key){
      var _tip = " ";
      var _lib = {
        "root": {
          "createdBy": {"tooltip": "Where did this file originate from? How was the LiPD file created?", "label": "Created By", "model": "files.json.createdBy", "disabled": false, "fieldType": "text", "size": 50},
          "lipdVersion": {"tooltip": "Ontology and data structure change by version. We'll handle this for you, but it's important to know the current version.", "label": "LiPD Version *", "model": "files.json.lipdVersion", "disabled": true, "fieldType": "number", "size": 50},
          "dataSetName": {"tooltip": "Please use the format 'Name.Location.Year' for your dataset name", "label": "Dataset Name *", "model": "files.json.dataSetName", "disabled": false, "fieldType": "text", "size": 50},
          "collectionName": {"tooltip": "NA", "label": "Collection Name", "model": "files.json.collectionName", "disabled": false, "fieldType": "text", "size": 33, },
          "investigators": {"tooltip": "Use the format: LastName, FirstName; LastName, FirstName; ...", "label": "Investigators", "model": "files.json.investigators", "disabled": false, "fieldType": "text", "size": 66, },
          "notes": {"tooltip": "Use to add information that does not fit elsewhere in the dataset", "label": "Notes", "model": "files.json.notes", "disabled": false, "fieldType": "text", "size": 100},
          "archiveType": { "tooltip": "Which ProxyArchive underlies this ProxySystem?", "label": "Archive Type", "model": "files.json.archiveType", "disabled": false, "size": 50},

        },
        "funding": {
          "agency": {"tooltip": "Which entity was the Dataset funded by?"},
          "grant": {"tooltip": "What was the Funding source for the Dataset?"},
          "principalInvestigator": {"tooltip": "Who was the lead on the source of Funding for the Dataset?"},
          "country": {"tooltip": "Which nation funded the Dataset?"}

        },
        "noaa": {
          "earliestYear" : {"tooltip": "NA"},
          "mostRecentYear" : {"tooltip": "NA"},
          "timeUnit": {"tooltip": "NA"},
          "onlineResource": {"tooltip": "NA"},
          "onlineResourceDescription": {"tooltip": "NA"},
          "originalSourceUrl": {"tooltip": "NA"},
          "modifiedDate": {"tooltip": "NA"},
          "datasetDOI": {"tooltip": "What is the digital object identifier associated with the dataset? Example: 10.1000/sample123"},
        },
        "pub": {
          "publication": {"tooltip": "A document that serves as reference for a Dataset or its components"},
          "doi": {"tooltip": "What is the digital object identifier associated with the resource?  Example: 10.1000/sample123"},
          "title": {"tooltip": "What is the title of the Publication?"},
          "journal": {"tooltip": "What is the name of the journal in which the resource can be found?"},
          "report": {"tooltip": "NA"},
          "year": {"tooltip": "What year was the Publication issued? (not required for dataCitations)"},
          "pages": {"tooltip": "In what pages of the Publication can the reference to the resource be found? (not required for dataCitations)"},
          "volume": {"tooltip": "In which volume of the Publication does the reference to the Datatset appear?"},
          "edition": {"tooltip": "In which edition of the Publication does the reference to the Datatset appear?"},
          "issue": {"tooltip": "In what issue of the journal can the resource be found?"},
          "type": {"tooltip": "What publication type? (journal-article, data citation, etc.)"},
          "abstract": {"tooltip": "NA"},
          "citation": {"tooltip": "NA"},
          "author": {"tooltip": "Who wrote (i.e., created) the resource, such as a Publication? Use format: LastName, FirstName"},
        },
        "geo": {
          "latitude": {"tooltip": "The latitude value in decimal degrees from -90 to 90"},
          "longitude": {"tooltip": "The longitude value in decimal degrees from -180 to 180"},
          "elevation": {"tooltip": "Elevation value in meters"},
          "units": {"tooltip": "Standard elevation units is meters"},
          "siteName": {"tooltip": "NA"},
          "location": {"tooltip": "NA"},
          "country" : {"tooltip": "ISO 3166 standard country list"},
          "gcmdLocation": {"tooltip": "Example: Continent>North America>United States of America>Baltimore"},

        },
        "paleoData": {
          "paleoData": {"tooltip": "The Data pertaining to past environmental variability"},
          "measurement": {"tooltip": "DataTable that contains the Variables (both measured and inferred)"},
          "model": {"tooltip": "Model used to derive an environmental axis from the PaleoDataModel"},
          "table": {"tooltip": "DataTable containing PaleoData Variables"},
          "values": {"tooltip": "What are the numerical values of the Variable, Uncertainty, and Model outputs?"},
          "variableName": {"tooltip": "NA"},
          "units": {"tooltip": "In what unit of measure is (are) the Variable(s) expressed?"},
          "description": {"tooltip": "What additional details would you give about the resource?"},
          "calibration": {"tooltip": "NA"},
          "hasResolution": {"tooltip": "What is the Resolution of the Variable?"},
          "hasMinValue": {"tooltip": "What is the minimum value of the Variable?"},
          "hasMaxValue": {"tooltip": "What is the maximum value of the Variable?"},
          "hasMeanValue": {"tooltip": "What is the mean value of the Variable?"},
          "hasMedianValue": {"tooltip": "What is the median value of the Variable?"},
          "inferredVariableType": {"tooltip": "What type of InferredVariable does the InferredVariable belongs to?"},
          "interpretation": {"tooltip": "A suite of metadata that describes which phenomena drove variability in this Variable (e.g. environmental drivers)."},
          "direction": {"tooltip": "Is the InferredVariable value increasing or decreasing as the value of the MeasuredVariable is increasing?"},
          "measurementMaterial": {"tooltip": "NA"},
          "method": {"tooltip": "How is the information obtained from the resource?"},
          "missingValue": {"tooltip": "How are the missing values of the Variable identified in the DataTable?"},
          "notes": {"tooltip": "Use to add information that does not fit elsewhere in the dataset"},
          "physicalSample": {"tooltip": "The actual sample on which the measurements are made. For instance, the lake core analyzed in the lab is the physical sample."},
          "proxy": {"tooltip": "NA"},
          "proxyObservationType": {"tooltip": "What type of ProxyObservation does the MeasuredVariable or Proxy System belong to? For example, the measured value of 5.63 mmol/mol is of type Mg/Ca, or the proxy observation of the current prpoxy system is Mg/Ca"},
          "sensorGenus": {"tooltip": "What is the Genus of the Organic ProxySensor?"},
          "sensorSpecies": {"tooltip": "What is the species of the Organic ProxySensor?"},
          "takenAtDepth": {"tooltip": "At which depth in the ProxyArchive is the Variable measured or inferred?"},
          "variableType": {"tooltip": "NA"},
          "name": {"tooltip": "NA"},
          "runCommand": {"tooltip": "NA"},
          "runEnv": {"tooltip": "NA"},
        },
        "chronData": {
          "chronData": {"tooltip": "The data, metadata, and Model that describe the set of Variables used to relate depth/position to time (chronological information)"},
          "measurement": {"tooltip": "DataTable that contains the Variables (both measured and inferred)"},
          "model": {"tooltip": "Model used to derive a time (or age) axis from the ChronDataModel"},
          "table": {"tooltip": "DataTable containing Variables pertaining to chronological information"},
        },
        "misc": {
          "editMode": {"tooltip": "Edit mode allows you to delete fields. Turn on to show delete buttons, and turn back off when done."},
          "addCustom": {"tooltip": "Don't see the field you want? Type in the box and press enter."},
          "addFields": {"tooltip": "Choose the field you would like to add to this column"},
          "fetchDoi": {"tooltip": "Provide a valid DOI and we'll fetch the associated publication information."},
          "map": {"tooltip": "We'll drop a pin on the dataset location using the coordinates given in the Geo section."},
          "graph": {"tooltip": "Use table data to plot two columns on a simply X,Y graph."}
        }
      };
      try{
        _tip = _lib[section][key].tooltip;
      } catch(err){
      }
      return _tip;
    }),

    variableTypeList: (function(){
      return ["measured", "inferred"];
    }),

    yearList: (function(){
      var _years = [];
      for(var _n=new Date().getFullYear(); _n>1950; _n--){
        _years.push(_n);
      }
      return(_years);
    }),

    getPopover: (function(name){
      var _popovers = {
        "lipd": '' +
        '<h5>LiPD Requirements</h5><br>' +
        '<p>Root:</p><ul>' +
        '<li>dataSetName</li>' +
        '<li>archiveType</li>' +
        '<li>createdBy</li>' +
        '</ul><br><p>Geo:</p><ul>' +
        '<li>coordinates</li>' +
        '</ul><br><p>paleoData:</p><ul>' +
        '<li>measurementTable</li>' +
        '</ul><br><p>Columns:</p><ul>' +
        '<li>variableName</li>' +
        '<li>units ("unitless" if units not applicable)</li>' +
        '<li>values</li>' +
        '</ul>',
        "wiki": '' +
        '<h5>Linked Earth Wiki Requirements</h5><br>' +
        '<p>In addition to the normal LiPD Requirements: </p>' +
        '</ul><br><p>Columns:</p><ul>' +
        '<li>proxyObservationType</li>' +
        '<li>variableType</li>' +
        '<li>takenAtDepth</li>' +
        '<li>inferredVariableType</li>' +
        '</ul>',
        "noaa": '' +
        '<h5>NOAA Requirements</h5><br>' +
        '<p>In addition to the normal LiPD Requirements: </p>' +
        '</ul><br><p>NOAA specific:</p><ul>' +
        '<li>maxYear</li>' +
        '<li>minYear</li>' +
        '<li>timeUnit</li>' +
        '<li>onlineResource</li>' +
        '<li>onlineResourceDescription</li>' +
        '<li>modifiedDate</li><br>' +
        '</ul><p>Root Level:</p><ul>' +
        '<li>investigators</li>' +
        '</ul><br><p>Geo:</p><ul>' +
        '<li>siteName</li>' +
        '<li>location</li>' +
        '</ul><br><p>Columns:</p><ul>' +
        '<li>description</li>' +
        '<li>dataFormat</li>' +
        '<li>dataType</li>'
      };

      return _popovers[name];

    }),


    variableNameList: (function(){

        var _ontology = create.ontology();
        var _variableNames = [];

        for(var _y=0; _y< _ontology["@graph"].length; _y++){
            var _entry = _ontology["@graph"][_y];
            if(create.inType("NamedIndividual", _entry)){
                if(_entry.hasOwnProperty("@id")){
                    if(_entry["@id"].indexOf("#") !== -1){
                        try{
                            if(_entry["rdfs:label"]["@value"]){
                              _variableNames.push(_entry["rdfs:label"]["@value"]);
                            }
                        } catch(err){
                          if(_entry.hasOwnProperty("rdfs:label")){
                            if(Array.isArray(_entry["rdfs:label"])){
                              for(var _g=0; _g < _entry["rdfs:label"].length; _g++){
                                if(_entry["rdfs:label"]["@value"]){
                                  _variableNames.append(_entry["rdfs:label"]["@value"]);
                                }
                              }
                            }
                          }
                        }
                    }
                }
            }
        }
        return _variableNames;
    }),


    ontology: (function(){
        return {
            "@context": {
                "dcterms": "http://purl.org/dc/terms/",
                "foaf": "http://xmlns.com/foaf/0.1/",
                "owl": "http://www.w3.org/2002/07/owl#",
                "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                "schema": "http://schema.org/",
                "vaem": "http://www.linkedmodel.org/schema/vaem#",
                "vann": "http://purl.org/vocab/vann/",
                "xsd": "http://www.w3.org/2001/XMLSchema#"
            },
            "@graph": [
                {
                    "@id": "_:Ne3f67c67918c4f1f8f1d157de742dbf5",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#MeasuredVariable"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Resolution"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Uncertainty"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Variable"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MeasuredVariable",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Variables that are measured by an Instrument. MeasuredVariables are ssn: Observations. They represent the values of a certain type of ProxyObservations"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Measured variable"
                    },
                    "rdfs:subClassOf": {
                        "@id": "_:N7d682b6640cf4c05ae2fd8f7e604b457"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subclass of Variables. Allows to make the disctinction between raw measurements (e.g., tree ring width, oxygen isotopes, trace elements) and the variables being reconstructed (e.g., moisture, temperature)"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#GrainSize",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Physical"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Grain size"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#principalInvestigator",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Who was the lead on the source of Funding for the Dataset?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Funding"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "principal investigator"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Person"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the source of Funding to the PI (a Person)"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.Funding1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hybrid",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Hybrid"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Hybrid"
                    }
                },
                {
                    "@id": "schema:Person",
                    "@type": "owl:Class",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://purl.oclc.org/NET/ssnx/ssn#Observation",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The class ssn:Observation provides the structure to represent a single observation. An observation is a situation that describes an observed feature, an observed property, a sensor and method of sensing used and a value observed for the property: that is, an observation describes a single value attributed to a single property by a particular sensor. Observations of multiple features or multiple properties of the one feature should be represented as either compound properties, features and values or as multiple observations, grouped in some appropriate structure."
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://purl.oclc.org/NET/ssnx/ssn"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Diffraction",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Diffraction"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Spectral"
                    }
                },
                {
                    "@id": "dcterms:creator",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "dcterms:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#SandFraction",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Composition"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Sand fraction\n"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Porosity",
                    "@type": [
                        "http://linked.earth/ontology#Physical",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Porosity"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#compilationCitation",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: How should someone cite the compilation?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Compilation"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "compilation citation"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": [
                        {
                            "@id": "schema:citation"
                        },
                        {
                            "@id": "dcterms:bibliographicCitation"
                        }
                    ],
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Data property needed to specify how to cite compilations, in order to provide appropriate credit to all contributors"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasColumnNumber",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which column of the csv file can the Variable be found?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has column number"
                    },
                    "rdfs:range": {
                        "@id": "xsd:integer"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the Variable metadata to the values stored in the csv file"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub"
                    }
                },
                {
                    "@id": "dcterms:isPartOf",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "dcterms:"
                    }
                },
                {
                    "@id": "http://www.opengis.net/ont/geosparql#Geometry",
                    "@type": "owl:Class",
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.opengis.net/spec/geosparql/1.0"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#DiffuseSpectralReflectance",
                    "@type": [
                        "http://linked.earth/ontology#Reflectance",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Diffuse spectral reflectance"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#measuredBy",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which Instrument was used to produce the MeasuredVariable?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#MeasuredVariable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "measured by"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Instrument"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://purl.oclc.org/NET/ssnx/ssn#observedBy"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the MeasuredVariable to the Instrument responsible for its creation"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.mgcarub"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#dD",
                    "@type": [
                        "http://linked.earth/ontology#StableHydrogenIsotope",
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#IsotopicComposition"
                    ],
                    "rdfs:label": [
                        {
                            "@language": "en",
                            "@value": "dD"
                        },
                        {
                            "@language": "en",
                            "@value": "DD"
                        }
                    ]
                },
                {
                    "@id": "http://linked.earth/ontology#collectedFrom",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Where (in the world) was the data in the Dataset collected? Refers to the location of the ProxyArchive"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "collected from"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Location"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "schema:contentLocation"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Describe the geographical coordinates for the provenance of the ProxyArchive where the dataset was collected from"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ICP-OES",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Inductively coupled plasma optical emission spectrometry"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Spectroscope"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#author",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Who wrote (i.e., created) the resource, such as a Publication?"
                    },
                    "rdfs:domain": {
                        "@id": "_:N860896530c474be7b345a4faeb872040"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "author"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Person"
                    },
                    "rdfs:subPropertyOf": [
                        {
                            "@id": "schema:author"
                        },
                        {
                            "@id": "dcterms:creator"
                        }
                    ],
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Give credit to the original author of the resource"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1002/2013PA002534"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Chemical",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Chemical"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyObservation"
                    }
                },
                {
                    "@id": "dcterms:bibliographicCitation",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "dcterms:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Uncertainty",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A state of incomplete knowledge that results from a lack of information or from different modeling choices. Uncertainty may come from many sources, from imprecision in the data to ambigously defined concepts or terminology. Uncertainty can be represented by quantitative measures (e.g., probability density function) or by qualitative statements (e.g., reflecting the judgement of a team of experts). Sensu IPCC AR5"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "https://www.ipcc.ch/pdf/assessment-report/ar5/wg1/WG1AR5_AnnexIII_FINAL.pdf"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Uncertainty"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "To allow to describe the uncertainty on a Variable or a Model, would it be a single number (e.g., the uncertainty on the measurements are 0.1 per mil, one sigma confidence level, or reportedIn an EnsembleTable and/or SummaryTable)"
                    },
                    "vann:example": [
                        {
                            "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst.Uncertainty"
                        },
                        {
                            "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.Uncertainty"
                        }
                    ]
                },
                {
                    "@id": "http://linked.earth/ontology#DataTable",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A set of Variables organized in columns"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Data table"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Connects to the csv file where the data values are stored"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#title",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the title of the Publication?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "title"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "dcterms:title"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Part of standard metadata for Publications"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1029/98PA00070"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#N",
                    "@type": [
                        "http://linked.earth/ontology#MajorElement",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "N"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ICP-AES",
                    "@type": "owl:Class",
                    "owl:equivalentClass": {
                        "@id": "http://linked.earth/ontology#ICP-OES"
                    },
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Inductively coupled plasma atomic emission spectroscopy (ICP-AES), also referred to as inductively coupled plasma optical emission spectrometry (ICP-OES), is an analytical technique used for the detection of trace metals."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Inductively coupled plasma atomic emission spectroscope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Spectroscope"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#C",
                    "@type": [
                        "http://linked.earth/ontology#MajorElement",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "C"
                    }
                },
                {
                    "@id": "dcterms:references",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "dcterms:"
                    }
                },
                {
                    "@id": "http://ontosoft.org/software#hasImplementationLanguage",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "http://ontosoft.org/software#"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#P",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#MajorElement"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "P"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#StableNitrogenIsotope",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Stable Nitrogen isotope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#StableIsotope"
                    }
                },
                {
                    "@id": "schema:contributor",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ProxyObservationModel",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The Model of how ProxyObservations are made on the archive. Sensu Evans et al. (2013)"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.sciencedirect.com/science/article/pii/S0277379113002011"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Proxy observation model"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "We adopted the Evans et al. (2013) framework since this is the only published definition of what is most commonly referred to as \"\"proxy\"\" in the paleoclimate community"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#datasetDate",
                    "@type": [
                        "owl:DatatypeProperty",
                        "owl:FunctionalProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: At what date was the Dataset created?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "dataset date"
                    },
                    "rdfs:range": {
                        "@id": "xsd:dateTime"
                    },
                    "rdfs:subPropertyOf": [
                        {
                            "@id": "schema:dateCreated"
                        },
                        {
                            "@id": "dcterms:created"
                        }
                    ],
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Separate dataset date from the publication year. An example is LR04 (datsetdate in 2004) but published in 2005"
                    },
                    "vann:example": {
                        "@language": "en",
                        "@value": "http://wiki.linked.earth/MD982181.Khider.2014"
                    }
                },
                {
                    "@id": "_:N450caa134e29410796a2ef5f61e01e33",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Instrument"
                            },
                            {
                                "@id": "http://linked.earth/ontology#PhysicalSample"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#housedAt",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which laboratory/repository is the Instrument/PhysicalSample located?"
                    },
                    "rdfs:domain": {
                        "@id": "_:N450caa134e29410796a2ef5f61e01e33"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "housed at"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Link to a particular laboratory. Provides circumstantial information about the measurement technique and how it was applied. Allows to give some information about the actual location of the sample"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.mgcarub"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#IsotopicComposition",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Isotopic composition"
                    },
                    "rdfs:subClassOf": {
                        "@id": "_:Nbab0ec35d4e044ddbefb12e9bab3a98f"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#carbonateSaturation",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#OceanChemistry"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Carbonate saturation"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ElNinoIndex",
                    "@type": "owl:Class",
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ClimateIndex"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#StableOxygenIsotope",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Stable Oxygen isotope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#StableIsotope"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#palmerDroughtSeverityIndex",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Hydrology",
                        "http://linked.earth/ontology#ClimateIndex"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Palmer Drought Severity Index (PDSI)"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasMinValue",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the minimum value of the Variable?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has min value"
                    },
                    "rdfs:range": {
                        "@id": "xsd:float"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "property relevant to facilitate queries, as in most cases the contents of a csv file are not directly represented"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#X-rayFluorescence",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Fluorescence"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "X-ray fluorescence"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#StableSulfurIsotope",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Stable sulfur isotope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#StableIsotope"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Mn/Ca",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#TraceElement"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Mn/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasISSN",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the International Standard Serial Number of the Publication?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has ISSN"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "dcterms:identifier"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "8-digit code used to identify publications"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#description",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What additional details would you give about the resource?"
                    },
                    "rdfs:domain": {
                        "@id": "owl:Thing"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "description"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "This property may be used to provide further details on instrument descriptions, uncertainty description,etc."
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#nitrousOxideConcentration",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#AtmosphericChemistry"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Nitrous oxide concentration"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MassSpectrometer",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Spectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#foundInTable",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which DataTable can the information/data be found?"
                    },
                    "rdfs:domain": {
                        "@id": "_:N04e57699f5d946f4b42475aa595572b6"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "found in table"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#DataTable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to link the data to the csv table and the models to its output"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Model",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A mathematical construct that is at least partially isomorphic to the target system, and is used to derive information about the structure and/or dynamics of the target system"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Model"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to describe models whose outputs are stored in the Dataset. One example of is Bchron for age modeling"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.PaleoData1.Model1"
                    }
                },
                {
                    "@id": "http://www.isi.edu/~gil/",
                    "@type": "owl:NamedIndividual"
                },
                {
                    "@id": "schema:name",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:domain": {
                        "@id": "owl:Thing"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    }
                },
                {
                    "@id": "_:N72e8f21a0c32478695ca91efaf15be56",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#MeasuredVariable"
                            },
                            {
                                "@id": "http://linked.earth/ontology#ProxySystem"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Tree",
                    "@type": "owl:Class",
                    "rdfs:isDefinedBy": {
                        "@id": "http://wiki.linked.earth/Tree"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Tree"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    }
                },
                {
                    "@id": "http://w3id.org/people/dgarijo",
                    "@type": "owl:NamedIndividual"
                },
                {
                    "@id": "http://linked.earth/ontology#interpretationDirection",
                    "@type": [
                        "owl:DatatypeProperty",
                        "owl:FunctionalProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Is the InferredVariable value increasing or decreasing as the value of the MeasuredVariable is increasing?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Interpretation"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "interpretation direction"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Answer is only positive or negative. Useful metadata when the calibration equation is not readily available.\nAlso applies to InferredVariable to faciliate the search in database"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.d18orub.Interpretation1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#datasetVersion",
                    "@type": [
                        "owl:DatatypeProperty",
                        "owl:FunctionalProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the version of the Dataset?\n\nIt should follow the x.y.z notation where x refers to changes in metadata and data following a publication (for instance, the creation of a new age model using a different code), y refers to changes to the data following a publication (for instance, adding data further back in time without changing the model underlying the interpretation), and z refers to changes not associated with a publication (for instance, typos)."
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "dataset version"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "schema:version"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to update a dataset if Data/Models are added and keep track of the various versions"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#freeOxygenLevels",
                    "@type": [
                        "http://linked.earth/ontology#AtmosphericChemistry",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Free oxygen levels"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Archea",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Archea"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#PaleoModel",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Model used to derive an environmental axis from the PaleoDataModel"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Paleo model"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subdivision between chronological and paleoenvironmental information reflects the fact that Datasets are fundamentally characterized by two distinct components"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.PaleoData1.Model1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#LA-ICP-MS",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Laser-ablation (LA) Inductively coupled plasma mass spectrometry (ICP-MS)"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#IsotopeRatioMassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#AcceleratorMassSpectrometer",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Accelerator mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#MassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Spectrometer",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Instrument"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#modelReferences",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which Publication is the model described/applied?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "model references"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "dcterms:references"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links a Model to its Publication. \nNote: calibrationReferences and modelReferences in the Calibration may not need to be the same. For instance, the calibration data and one mathematical formulation can be provided in one Publication (answering the calibrationReferences) but a different mathematical Model may be applied in another Publication (answering the modelReferences)"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.Calibration"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#radiocarbonAge",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Time"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Radiocarbon age"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ensembleTableGeneratedByModel",
                    "@type": [
                        "owl:FunctionalProperty",
                        "owl:ObjectProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which EnsembleTable is the Model output found?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#EnsembleTable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "ensemble table generated by model"
                    },
                    "rdfs:range": {
                        "@id": "_:N642899cf4ccf4f428d9d2f08bb678a6d"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://linked.earth/ontology#generatedByModel"
                    },
                    "vaem:rationale": [
                        {
                            "@language": "en",
                            "@value": "\"Subproperty of foundinTable to link the Model to its outputs\""
                        },
                        {
                            "@id": "http://wiki.linked.earth/ODP1098B1_2.ChronData1.Model1"
                        }
                    ]
                },
                {
                    "@id": "http://linked.earth/ontology#EnsembleTable",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "DataTable constaining many possible series of how the Variable is modeled. Output of a Model"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Ensemble table"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#DataTable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Added to allow outputs from Bayesian model to be saved as part of a dataset"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/ODP1098B12.Chron1.Model1.EnsembleTable"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#StableCarbonIsotope",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "<p><a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Carbon\">Carbon</a> in nature exists in oxidized (i.e., <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Carbon_dioxide\">CO<sub>2</sub></a> and <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Carbonate\">carbonates</a>), elemental (i.e., <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Graphite\">graphite</a> and <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Diamond\">diamond</a>), and reduced (i.e., <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Methane\">methane</a> and organic matter]) forms. Carbon has two <a href=\"/Category:StableIsotope\" title=\"Category:StableIsotope\"> stable isotopes</a>: the light isotope <sup>12</sup>C (abundance: 98.9%, mass: 12.000000 amu) and the heavy isotope <sup>13</sup>C (abundance: 1.1%, mass: 13.003355 amu). Since the mass of <sup>13</sup>C is higher than the mass of <sup>12</sup>C, the carbon isotopes are fractionated by chemical and biological processes. In general, <sup>12</sup>C is strongly partitioned into organic matter (reduced form) while the heavy isotope is concentrated in the oxidized forms of carbon.\n</p>"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Stable Carbon isotope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#StableIsotope"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#WavelengthDispersiveSpectrometer",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Wavelength dispersive spectrometry"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Spectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Coral",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "<p>The geochemical tracers contain in the skeletons of <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Coral\">corals</a> provide an unaltered record of the chemical and physical conditions that existed in the surrounding seawater at the time of accretion of its calcium carbonate skeleton <sup id=\"cite_ref-druffel1997_1-0\" class=\"reference\"><a href=\"#cite_note-druffel1997-1\">[1]</a></sup>. Corals are useful oceanic recorders because they are widely distributed, can be accurately dated, provide an  enhanced time resolution (monthly) available from the high growth rate, and are nor subjected to the mixing processes that are present in all toxic sediments (i.e., bioturbation) <sup id=\"cite_ref-druffel1997_1-1\" class=\"reference\"><a href=\"#cite_note-druffel1997-1\">[1]</a></sup> <sup id=\"cite_ref-2\" class=\"reference\"><a href=\"#cite_note-2\">[2]</a></sup>.\n</p><p>Corals are from the order Scleractinian, a group in the subclass Zoantharia. Scleractinians include solitary and colonial species of corals. may of which secrete external skeletons of <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Aragonite\">aragonite</a> <sup id=\"cite_ref-druffel1997_1-2\" class=\"reference\"><a href=\"#cite_note-druffel1997-1\">[1]</a></sup>. The oldest known scleractinians are shallow water corals from the Middle Triassic <sup id=\"cite_ref-3\" class=\"reference\"><a href=\"#cite_note-3\">[3]</a></sup>.\n</p>\nThe polyp portion of the coral secretes calcium carbonate (CaCO<sub>3</sub>) as the mineral aragonite <sup id=\"cite_ref-druffel1997_1-3\" class=\"reference\"><a href=\"#cite_note-druffel1997-1\">[1]</a></sup>. Massive <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Hermatypic_coral\">hermatypic corals</a> (i.e., reef-building corals) are more desirable than the branching varieties for paleoreconstructions. First, massive corals form round, wave-resistant structures that can include hundreds of years of uninterrupted growth. Second, the accretion rate of calcium carbonate is much higher for hermatypic corals  that contain symbiotic <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Zooxanthellae\">zooxanthellae</a> than for deep species <sup id=\"cite_ref-druffel1997_1-4\" class=\"reference\"><a href=\"#cite_note-druffel1997-1\">[1]</a></sup>. Most massive reef corals live at water depths of &lt;40m and grow continuously at rated of 6-20 mm yr<sup>-1</sup> <sup id=\"cite_ref-4\" class=\"reference\"><a href=\"#cite_note-4\">[4]</a></sup><ol class=\"references\">\n<li id=\"cite_note-druffel1997-1\"><span class=\"mw-cite-backlink\">? <sup><a href=\"#cite_ref-druffel1997_1-0\">1.0</a></sup> <sup><a href=\"#cite_ref-druffel1997_1-1\">1.1</a></sup> <sup><a href=\"#cite_ref-druffel1997_1-2\">1.2</a></sup> <sup><a href=\"#cite_ref-druffel1997_1-3\">1.3</a></sup> <sup><a href=\"#cite_ref-druffel1997_1-4\">1.4</a></sup></span> <span class=\"reference-text\">Druffel, E. R. M. (1997). Geochemistry of corals: Proxies of past ocean chemistry, ocean circulation, and climate. Proceeding of the National Academy of Sciences, 94, 8354-8361. </span>\n</li>\n<li id=\"cite_note-2\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-2\">?</a></span> <span class=\"reference-text\"> Gagan, M. K., Ayliffe, L. K., Beck, J. W., Cole, J. E., Druffel, E. R. M., Dunbar, R. B., &amp; Schrag, D. P. (2000). New views of tropical paleoclimates from corals. Quaternary Science Reviews, 19(1-5), 45-64. doi:10.1016/S0277-3791(99)00054-2</span>\n</li>\n<li id=\"cite_note-3\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-3\">?</a></span> <span class=\"reference-text\"> Stanley, G. (1981). Early history of scleractinian corals and its geological consequences. Geology, 9, 507-511. </span>\n</li>\n<li id=\"cite_note-4\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-4\">?</a></span> <span class=\"reference-text\">Knutson, D. W., Buddemeier, R. W., &amp; Smith, S. V. (1972). Coal chronologies: seasonal growth bands in reef corals. Science, 177, 270-272. </span>\n</li>\n</ol>"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Coral"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MineralMatter",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Chemical"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Mineral matter"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#compilationVersion",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the version of the Compilation?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Compilation"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "compilation version"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "schema:version"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Needed to state the version associated to a compilation, which may not be the same as the datasets it contains"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ChronData",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The data, metadata, and Model that describe the set of Variables used to relate depth/position to time (chronological information)"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Chron data"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Data"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subdivision between chronological and paleoenvironmental information reflects the fact that Datasets are fundamentally characterized by two distinct components"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.ChronData1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Composition",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Composition"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Physical"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#B/Ca",
                    "@type": [
                        "http://linked.earth/ontology#TraceElement",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "B/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#datasetCitation",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Sentence indicating how a dataset should be cited"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "dataset citation"
                    },
                    "rdfs:range": {
                        "@id": "rdfs:Literal"
                    },
                    "rdfs:subPropertyOf": [
                        {
                            "@id": "schema:citation"
                        },
                        {
                            "@id": "dcterms:bibliographicCitation"
                        }
                    ],
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "The need for providing appropriate credit to the datasets"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Publication",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A document that serves as reference for a Dataset or its components"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Publication"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Can be used to credit the contributor of the dataset as well as linking toward the conclusions of the study and relevant methods"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1029/2012GC004293"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Gastropods",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Gastropods"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Mollusk"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Hybrid",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Hybrid"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#fundingAgency",
                    "@type": [
                        "owl:FunctionalProperty",
                        "owl:DatatypeProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which entity was the Dataset fundedBy?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Funding"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "funding agency"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Provides information about the Agency funding the study"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.Funding1"
                    }
                },
                {
                    "@id": "_:N7b16209ac5ab44f0a4334d922305c6ce",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Dataset"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Publication"
                            },
                            {
                                "@id": "http://linked.earth/ontology#SoftwareCode"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#arcticOscillation",
                    "@type": [
                        "http://linked.earth/ontology#ClimateIndex",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Arctic Oscillation (AO, AAO)"
                    }
                },
                {
                    "@id": "_:Nec46f2c1391a40a7ac51f49107b4a22c",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Uncertainty"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Variable"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#CFAMS",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Continuous-flow AMS system"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#AcceleratorMassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Coccolithophores",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Coccolithophores"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Snow",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Snow"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#InorganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#marineSediment",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#MarineSediment"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Marine sediment"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#d170",
                    "@type": [
                        "http://linked.earth/ontology#StableOxygenIsotope",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "d170"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#DistributionTable",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "DataTable containing the probability distribution of a single value of a Variable. Output of a Model"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Distribution table"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#DataTable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Added to allow outputs from Bayesian model (especially Bchron) to be saved as part of a dataset. Required to encode irregular probability distributions"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/ODP1098B12.Chron1.Model1.distributionTable.1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#TraceElement",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Trace element"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Chemical"
                    }
                },
                {
                    "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#long",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:domain": {
                        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#notes",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What additional information would you give about the Variable or DataTable ?"
                    },
                    "rdfs:domain": {
                        "@id": "_:Ne5356599ffdc48d2b371cc4c74ac5ea5"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "notes"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to add notes to specific cells in the DataTable"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/A7.Sun.2005.chron1measurement1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#wood",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Wood"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Wood"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#methaneConcentration",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#AtmosphericChemistry"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Methane concentration"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#orcidNumber",
                    "@type": [
                        "owl:FunctionalProperty",
                        "owl:DatatypeProperty"
                    ],
                    "rdfs:comment": "Answers the question: What is the persistent digital identifier of the Person?",
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Person"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "orcid number"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "dcterms:identifier"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "LinkedEarth uses ORCID number for membership"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/D._Khider"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Precipitation",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Precipitation"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Hydrology"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Reflectance",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Reflectance"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Spectral"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#proxySensorType",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which ProxySensor underlies this ProxySystem?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#ProxySystem"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "proxy sensor type"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#ProxySensor"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links ProxySensor to ProxyArchive"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.MarineSediment.Globigerinoides_ruber.Mg/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#includesPaleoData",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which PaleoData are included in the Dataset?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "includes paleo data"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#PaleoData"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://linked.earth/ontology#includesData"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subproperty of includesData. The subdivision between chronological and paleoenvironmental information reflects the fact that Datasets are fundamentally characterized by two distinct components"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MagneticSusceptibility",
                    "@type": [
                        "http://linked.earth/ontology#Physical",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Magnetic susceptibility\n"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#GasChromatographyMassSpectrometer",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Gas chromatography - mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#MassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#inferredFrom",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: From which MeasuredVariable(s) is (are) the InferredVariable inferred from?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#InferredVariable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "inferred from"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#MeasuredVariable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Provides a link between the Measured and Inferred Variables. For instance, SST is inferred from Mg/Ca measurements"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#datasetLicense",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "License associated to a dataset"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "dataset license"
                    },
                    "rdfs:range": {
                        "@id": "xsd:anyURI"
                    },
                    "rdfs:subPropertyOf": [
                        {
                            "@id": "schema:license"
                        },
                        {
                            "@id": "dcterms:license"
                        }
                    ],
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Property needed to let other scientists know about the usage and attribution terms of the uploaded dataset"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#U-Th",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Radioisotope"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "U-Th"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#SHRIMP",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Sensitive high-resolution ion microprobe"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#SecondaryIonMassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#BinocularMicroscope",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Binocular microscope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Microscope"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#atlanticMultiDecadalOscillation",
                    "@type": [
                        "http://linked.earth/ontology#ClimateIndex",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Atlantic Multi-decadal Oscillation (AMO)"
                    }
                },
                {
                    "@id": "_:Nc39b75cbf8334f9d9e7f1e87d2232b5e",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Instrument"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Model"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Variable"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#pages",
                    "@type": [
                        "owl:DatatypeProperty",
                        "owl:FunctionalProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In what pages of the Publication can the reference to the resource be found?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "pages"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Part of standard metadata for Publications"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1002/2013PA002534"
                    }
                },
                {
                    "@id": "_:N860896530c474be7b345a4faeb872040",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Compilation"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Dataset"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Publication"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Time",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Time"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#InferredVariable"
                    }
                },
                {
                    "@id": "dcterms:identifier",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "dcterms:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Li/Ca",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#TraceElement"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Li/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#reportedIn",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which EnsembleTable, DistributionTable, and/or SummaryTable is the Uncertainty reported?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Uncertainty"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "reported in"
                    },
                    "rdfs:range": {
                        "@id": "_:Ne5f4037fb4b34b5ea322a2d483b8eaf0"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the uncertainty to the model output"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst.Uncertainty"
                    }
                },
                {
                    "@id": "http://www.cefns.nau.edu/~npm4/",
                    "@type": "owl:NamedIndividual"
                },
                {
                    "@id": "http://linked.earth/ontology#Document",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Document"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#CRDS",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Cavity Ring-Down Spectroscopy"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Spectroscope"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Sr/Ca",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#TraceElement"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Sr/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Assemblage",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Assemblage"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyObservation"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#seaSurfaceTemperature",
                    "@type": [
                        "http://linked.earth/ontology#Temperature",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The temperature close to the ocean's surface"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Sea surface temperature"
                    }
                },
                {
                    "@id": "schema:funder",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#paleoModeledBy",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the PaleoModel for the PaleoData or ProxySytem under consideration?"
                    },
                    "rdfs:domain": {
                        "@id": "_:N7d3ff3f7ade2446d937b10cfe9f3a5e8"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "paleo modeled by"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#PaleoModel"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://linked.earth/ontology#modeledBy"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subclass of modeledBy, pertaining to paleoenvironmental information"
                    }
                },
                {
                    "@id": "schema:version",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Radioisotope",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Radioisotope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Isotope"
                    }
                },
                {
                    "@id": "_:Ncf059e502c8a4a519d6025b23d8f7197",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#ChronModel"
                            },
                            {
                                "@id": "http://linked.earth/ontology#PaleoModel"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ClayFraction",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Composition"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Clay fraction"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Instrument",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A tool  used to produce MeasuredVariables"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://linked.earth/ontology/core/1.2.0"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Instrument"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Needed to categorize types of instruments used for taking the different measurements. See Instrument Ontology for concept description."
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.ICPAES"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ChronProxySystem",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The combination of ProxyArchive, ProxySensor, and ProxyObservations pertaining to chronological information. For instance, measurements of radiocarbon on foraminiferal shells would have a ChronProxySystem consisting of ProxyArchive: marine sediment, ProxySensor: Foraminifera, ProxyObservations: Radiocarbon. (ref: Evans et al. [2013])"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Chron proxy system"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxySystem"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subdivision between chronological and paleoenvironmental information reflects the fact that Datasets are fundamentally characterized by two distinct components.\n\nAgreed that the ProxySystem concept applies to both Chron and PaleoData"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MarineSediment",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "<p><a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/w/index.php?title=Pelagic_sediment&amp;redirect=no\">Marine sediments</a> are a type of <a href=\"#ProxyArchive\" title=\"Category:ProxyArchive\"> proxy archives&rlm;&lrm;</a> that provide long, continuous records of past <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Ocean\">ocean</a> variability. The timescales associated with this <a href=\"#ProxyArchive\" title=\"Category:ProxyArchive\">archive&rlm;&lrm;</a> are usually in the order of several tens to millions of years. The resolution of the sedimentary archive varies from annual to multi-century. <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Paleoceanography\">Paleoceanographic</a> data are derived from many sensors found in deep-sea sediments including trace metal and isotopic composition of foraminifera, alkenones, and TEX86.\n</p>"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Marine sediment"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Ostracods",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Ostracods"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Mollusk"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#d13C",
                    "@type": [
                        "http://linked.earth/ontology#StableCarbonIsotope",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "d13C"
                    }
                },
                {
                    "@id": "http://www.opengis.net/ont/geosparql#asWKT",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:domain": {
                        "@id": "http://www.opengis.net/ont/geosparql#Geometry"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.opengis.net/ont/geosparql#"
                    },
                    "rdfs:range": {
                        "@id": "rdfs:Literal"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#name",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: How is the resource called?"
                    },
                    "rdfs:domain": {
                        "@id": "owl:Thing"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "name"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "schema:name"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982176.Stott.2004.paleo1measurement1.Mg/Ca-g.rub"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#LeadIsotope",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Radioisotope"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Lead Isotope"
                    }
                },
                {
                    "@id": "_:Ne5356599ffdc48d2b371cc4c74ac5ea5",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#DataTable"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Dataset"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Model"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Variable"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#LakeSediment",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "<p><a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Lake\">Lake</a> <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Sediment\">sediment</a> proxies provide widespread, continuous records of terrestrial environment variability. A variety of sensors are used to indicate past water temperature, physical properties, biology, and chemistry within the <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Lake\">lake</a> environment as well as changes in vegetation and precipitation in the <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Drainage_basin\">catchment</a> area.\n</p>"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Lake sediment"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#PaleoDataTable",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "DataTable containing PaleoData Variables"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "PaleoData table"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#DataTable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subdivision between chronological and paleoenvironmental information reflects the fact that Datasets are fundamentally characterized by two distinct components"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#InorganicProxySensor",
                    "@type": "owl:Class",
                    "owl:disjointWith": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    },
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "An inorganic substrate sensing enviromental changes. Examples: karst, snow, watershed, ice sheet, rock, etc."
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://linked.earth/ontology/core/"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Inorganic proxy sensor"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxySensor"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Encode the Genus and Species metadata"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#RockHammer",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Rock hammer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Instrument"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#CarbonateIonConcentration",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#OceanChemistry"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Carbonate ion concentration"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#nino4",
                    "@type": [
                        "http://linked.earth/ontology#ElNinoIndex",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Nino 4"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#nino1",
                    "@type": [
                        "http://linked.earth/ontology#ElNinoIndex",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Nino 1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#nino3",
                    "@type": [
                        "http://linked.earth/ontology#ElNinoIndex",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Nino 3"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#nino2",
                    "@type": [
                        "http://linked.earth/ontology#ElNinoIndex",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Nino 2"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Ba/Ca",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#TraceElement"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Ba/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#year",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Time"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Year"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#sclerosponge",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Sclerosponge"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Sclerosponge"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MajorElement",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Major element"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Chemical"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#SoftwareCode",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A script that describes the model, in any programming language (e.g., Excel, Matlab, Python, R)"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Software code"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://ontosoft.org/software#Software"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Added to allow for a link towards the code if on a public repository like GitHub"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Pyleoclim"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#IRMS",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "An <b>isotope-ration mass spectrometer</b> measures the relative abundance of isotopes in a given sample."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Isotope ratio mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#IsotopeRatioMassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ProxySystem",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "<p>Climate observations prior to the instrumental era are necessarily indirect. These observations are made on climate <b>proxies</b> in various geological (e.g. lake or marine sediments, living or fossil coral reefs, cave deposits), glaciological (ice cores or snow pits) or biological (trees) archives. Many types of data can often be collected from each archives, each <b>sensing</b> a different aspect of the environment (sometimes, several aspects at once).  A paleoclimate dataset is almost always a <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Time_series\">time series</a> of observations made on an archive.</p>\n<p>\nEvans et al. (2013) <sup id=\"cite_ref-evans2013_1-0\" class=\"reference\"><a href=\"#cite_note-evans2013-1\">[1]</a></sup> define a proxy system as comprised of three components (Fig 1).:\n</p>\n<ul><li> The <a href=\"#ProxySensor\" title=\"Category:ProxySensor\"> sensor</a> comprises physical, chemical, and/or biological components that react to environmental conditions. Sensors often respond to more than one environmental <a href=\"#InferredVariable\" title=\"Category:InferredVariable\"> variable</a>, and may have complex responses to the environment they sense, including thresholds  (record only part of the range of environmental conditions), seasonal biases (record environmental conditions over a few months of the year), and/or  nonlinear responses. For instance, <a href=\"#Foraminifera\" title=\"Category:Foraminifera\"> foraminifera</a> are an often used sensor for oceanic conditions. Multiple observations can be made on this sensor, recording different environmental <a href=\"#InferredVariable\" title=\"Category:InferredVariable\"> variables</a>. Similarly, picking foraminifera of a given species to conduct the measurements is part of the observation process, though it does affect the sensor definition&nbsp;: the habitat of these forams determines with environmental <a href=\"#InferredVariable\" title=\"Category:InferredVariable\"> variable</a> (e.g. surface, sub-surface, or thermocline temperature) they are most sensitive to.  </li></ul>\n<ul><li> The <a href=\"#ProxyArchive\" title=\"Category:ProxyArchive Â©\"> archive</a> is the medium in which the response of a sensor to environmental forcing is recorded.  Marine sediments are a type of archive, on which many sensors and observations may be recorded (e.g. Foraminifera Mg/Ca, Î´<sup>18</sup>O, TEX86)</li></ul>\n<ul><li> <a href=\"#ProxyObservation\" title=\"Category:ProxyObservation\"> Observations</a> are made on archives and are  generally referred to as \"proxies\". The term \"proxy\" used ubiquitously, and often ambiguously, throughout the paleoclimate literature, is most commonly equivalent to \"sensor + observation\". \"Observation\" is the more explicit, and thus, preferred term, however \"proxy\" can be treated as a synonym of \"observation\". For instance, Foraminifera Mg/Ca is often used to investigate past changes in sea-surface temperature but depends also on sea-surface salinity and deep-ocean carbonate saturation <sup id=\"cite_ref-2\" class=\"reference\"><a href=\"#cite_note-2\">[2]</a></sup>.  Furthermore, its temperature and salinity dependence is exponential <sup id=\"cite_ref-3\" class=\"reference\"><a href=\"#cite_note-3\">[3]</a></sup> <sup id=\"cite_ref-4\" class=\"reference\"><a href=\"#cite_note-4\">[4]</a></sup> <sup id=\"cite_ref-5\" class=\"reference\"><a href=\"#cite_note-5\">[5]</a></sup> while its response to carbonate saturation is thresholded <sup id=\"cite_ref-6\" class=\"reference\"><a href=\"#cite_note-6\">[6]</a></sup>.  </li></ul>\n\n<p>These three major components may be individually modeled, and linked together within a <a href=\"/Category:ProxySystemModel_%C2%A9\" title=\"Category:ProxySystemModel Â©\">Proxy System Model</a> <sup id=\"cite_ref-evans2013_1-2\" class=\"reference\"><a href=\"#cite_note-evans2013-1\">[1]</a></sup> <sup id=\"cite_ref-7\" class=\"reference\"><a href=\"#cite_note-7\">[7]</a></sup>. Some sensors are common to multiple archives (e.g. Î´<sup>18</sup>O), and all archives support more than one possible sensor. \n</p>\n\n<h2><span class=\"mw-headline\" id=\"References\">References</span></h2>\n\n<ol class=\"references\">\n<li id=\"cite_note-evans2013-1\"><span class=\"mw-cite-backlink\">â†‘ <sup><a href=\"#cite_ref-evans2013_1-0\"><span class=\"cite-accessibility-label\">Jump up to: </span>1.0</a></sup> <sup><a href=\"#cite_ref-evans2013_1-1\">1.1</a></sup> <sup><a href=\"#cite_ref-evans2013_1-2\">1.2</a></sup></span> <span class=\"reference-text\"> Evans, M. N., Tolwinski-Ward, S. E., Thompson, D. M., &amp; Anchukaitis, K. J. (2013). Applications of proxy system modeling in high resolution paleoclimatology. Quaternary Science Reviews, 76, 16-28. doi:10.1016/j.quascirev.2013.05.024 </span>\n</li>\n<li id=\"cite_note-2\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-2\"><span class=\"cite-accessibility-label\">Jump up </span>â†‘</a></span> <span class=\"reference-text\"> Khider, D., Huerta, G., Jackson, C., Stott, L. D., &amp; Emile-Geay, J. (2015). A Bayesian, multivariate calibration for Globigerinoides ruber Mg/Ca. Geochemistry Geophysics Geosystems, 16(9), 2916-2932. doi:10.1002/2015GC005844 </span>\n</li>\n<li id=\"cite_note-3\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-3\"><span class=\"cite-accessibility-label\">Jump up </span>â†‘</a></span> <span class=\"reference-text\"> Anand, P., Elderfield, H., &amp; Conte, M. H. (2003). Calibration of Mg/Ca thermometry in planktonic foraminifera from a sediment trap time series. Paleoceanography, 18(2), 1050. doi:10.1029/2002PA000846 </span>\n</li>\n<li id=\"cite_note-4\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-4\"><span class=\"cite-accessibility-label\">Jump up </span>â†‘</a></span> <span class=\"reference-text\"> Lea, D. W., Mashiotta, T. A., &amp; Spero, H. J. (1999). Controls on magnesium and strontium uptake in planktonic foraminifera determined by live culturing. Geochimica et cosmochimica acta, 63(16), 2369-2379. </span>\n</li>\n<li id=\"cite_note-5\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-5\"><span class=\"cite-accessibility-label\">Jump up </span>â†‘</a></span> <span class=\"reference-text\"> KisakÃ¼rek, B., Eisenhauer, A., BÃ¶hm, F., Garbe-SchÃ¶nberg, D., &amp; Erez, J. (2008). Controls on shell Mg/Ca and Sr/Ca in cultured planktonic foraminiferan, Globigeriniodes ruber (white). Earth and Planetary Science Letters, 273, 260-269. doi:10.1016/j.epsl.2008.06.026 </span>\n</li>\n<li id=\"cite_note-6\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-6\"><span class=\"cite-accessibility-label\">Jump up </span>â†‘</a></span> <span class=\"reference-text\"> Regenberg, M., Regenberg, A., Garbe-Schonberg, D., &amp; Lea, D. W. (2014). Global dissolution effects on planktonic foraminiferal Mg/Ca ratios controlled by the calcite-saturation state of bottom waters. Paleoceanography, 29, 127-142. doi:10.1002/2013PA002492 </span>\n</li>\n<li id=\"cite_note-7\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-7\"><span class=\"cite-accessibility-label\">Jump up </span>â†‘</a></span> <span class=\"reference-text\"> Dee, S., Emile-Geay, J., Evans, M. N., Allam, A., Steig, E. J., &amp; Thompson, D. M. (2015). PRYSM: An open-source framework  for PRoxy System Modeling, with applications to oxygen-isotope systems. Journal of Advances in Modeling Earth Systems, 7, 1220-1247. doi:10.1002/2015MS000447</span>\n</li>\n</ol>"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.sciencedirect.com/science/article/pii/S0277379113002011"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Proxy system"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "We adopted the Evans et al. (2013) framework since this is the only published definition of what is most commonly referred to as \"proxy\" in the paleoclimate community"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.MarineSediment.Globigerinoides_ruber.Mg/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ProxySensor",
                    "@type": "owl:Class",
                    "rdfs:comment": [
                        {
                            "@language": "en",
                            "@value": "The sensor comprises physical, chemical, and/or biological components that react to environmental conditions. Sensors often respond to more than one environmental variable, and may have complex responses to the environment they sense, including thresholds (record only part of the range of environmental conditions), seasonal biases (record environmental conditions over a few months of the year), and/or nonlinear responses (Evans et al. (2013))"
                        },
                        {
                            "@language": "en",
                            "@value": "The sensor comprises physical, chemical, and/or biological components that react to environmental conditions. Sensors often respond to more than one environmental variable, and may have complex responses to the environment they sense, including thresholds (record only part of the range of environmental conditions), seasonal biases (record environmental conditions over a few months of the year), and/or nonlinear responses (Evans et al. (2013)). Signals recorded by the ProxySensor are imprinted onto the ProxyArchive."
                        }
                    ],
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.sciencedirect.com/science/article/pii/S0277379113002011"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Proxy sensor"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "See ProxySensor ontology for details about the concept. \n\nWe adopted the Evans et al. (2013) framework since this is the only published definition of what is most commonly referred to as \"\"proxy\"\" in the paleoclimate community"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Cibicidoides_mundulus"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#PaleoProxySystem",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Climate observations prior to the instrumental era are necessarily indirect. These observations are made on climate proxies in various geological (e.g. lake or marine sediments, living or fossil coral reefs, cave deposits), glaciological (ice cores or snow pits) or biological (trees) archives. Many types of measurements can be made on each archives, each sensing a different aspect of the environment (sometimes, several aspects at once). A paleoclimate dataset is a set of observations made on an archive."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Paleo proxy system"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxySystem"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Gives a formal definition of climate proxy following the Evans et al. (2013) framework.\nSubclass of ProxySystem, pertaining to climate information"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#glacierIce",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#GlacierIce"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Glacier ice"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Resistivity",
                    "@type": [
                        "http://linked.earth/ontology#Physical",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Resistivity"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#LayerThickness",
                    "@type": [
                        "http://linked.earth/ontology#Physical",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Layer thickness"
                    }
                },
                {
                    "@id": "http://www.w3.org/ns/prov#wasDerivedFrom",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.w3.org/ns/prov#"
                    }
                },
                {
                    "@id": "dcterms:license",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "dcterms:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Luminescence",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Spectral"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Luminescence"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ProxyArchiveModel",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A Model of how the ProxySensor either creates or emplaces the signal into the ProxyArchive. Sensu Evans et al. (2013)"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.sciencedirect.com/science/article/pii/S0277379113002011"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Proxy archive model"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "We adopted the Evans et al. (2013) framework since this is the only published definition of what is most commonly referred to as \"\"proxy\"\" in the paleoclimate community\""
                    }
                },
                {
                    "@id": "_:Nc4400976b3334c8c961247ed39ec43e9",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#ChronData"
                            },
                            {
                                "@id": "http://linked.earth/ontology#ChronProxySystem"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#proxyObservationType",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What type of ProxyObservation does the MeasuredVariable or Proxy System belong to?\nFor example, the measured value of 5.63 mmol/mol is of type Mg/Ca, or the proxy observation of the current prpoxy system is Mg/Ca"
                    },
                    "rdfs:domain": {
                        "@id": "_:N72e8f21a0c32478695ca91efaf15be56"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "proxy observation type"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#ProxyObservation"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "The need to link a measured variable or a proxy system to the proxy observation type being measured."
                    },
                    "vann:example": [
                        {
                            "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub"
                        },
                        {
                            "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.MarineSediment.Globigerinoides_ruber.Mg/Ca"
                        }
                    ]
                },
                {
                    "@id": "http://linked.earth/ontology#ProxyArchive",
                    "@type": "owl:Class",
                    "rdfs:comment": [
                        {
                            "@language": "en",
                            "@value": "According to the Evans et al. (2013), the medium in which the response of a ProxySensor to environmental forcing is recorded. Example of archives include: marine sediments, corals, wood, lake sediments, speleothems, glacier ice"
                        },
                        {
                            "@language": "en",
                            "@value": "The medium in which the response of a sensor to environmental forcing is recorded. Sensu Evans et al. (2013).\n\nExamples of archives include: marine sediments, corals, wood, lake sediments, speleothems, glacier ice, etc."
                        }
                    ],
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.sciencedirect.com/science/article/pii/S0277379113002011"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Proxy archive"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "\"See ProxyArchive ontology for details about the concept. \n\nWe adopted the Evans et al. (2013) framework since this is the only published definition of what is most commonly referred to as \"\"proxy\"\" in the paleoclimate community\""
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.d18omund.MarineSediment"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Watershed",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Watershed"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#InorganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#OceanChemistry",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Ocean chemistry"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#InferredVariable"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#volume",
                    "@type": [
                        "owl:FunctionalProperty",
                        "owl:DatatypeProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which volume of the Publication does the reference to the Datatset appear?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "volume"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Part of standard metadata for Publications"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1029/98PA00070"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#CalibrationModel",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Metadata about how the variable was calibrated to reflect an environmental variable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Calibration model"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Make the model behind the calibration explicit"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.Calibration"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#SiltFraction",
                    "@type": [
                        "http://linked.earth/ontology#Composition",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Silt fraction"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Karst",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Karst"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#InorganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Foraminifera",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Because of their population size, foraminifera produce a significant amount of oceanic carbonate, making them a valuable source of paleoceanographic information.\n\nThe following parameters are used in paleoceanographic applications:\n\n* Faunal Assemblage\n* Geochemical measurements:\n *  Isotopes\n * Stable oxygen isotopes\n * Stable carbon isotopes\n * Radiocarbon\n* Trace Elements"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://wiki.linked.earth/Foraminifera"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Foraminifera"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Density",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Physical"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Density"
                    }
                },
                {
                    "@id": "schema:license",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#coral",
                    "@type": [
                        "http://linked.earth/ontology#Coral",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Coral"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#sensorGenus",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": "Answers the question: What is the Genus of the Organic ProxySensor?",
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "sensor genus"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Scientific Name of the organic ProxySensor"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Globigerinoides_ruber"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#proxyArchiveType",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which ProxyArchive underlies this ProxySystem?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#ProxySystem"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "proxy archive type"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links ProxySystem to ProxyArchive"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.MarineSediment.Globigerinoides_ruber.Mg/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#interpretedAs",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the Variable's Interpretation?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "interpreted as"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Interpretation"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the Variable to its Interpretation"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Spectroscope",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Spectroscope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Instrument"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#publicationYear",
                    "@type": [
                        "owl:FunctionalProperty",
                        "owl:DatatypeProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What year was the Publication issued?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "publication year"
                    },
                    "rdfs:range": {
                        "@id": "xsd:int"
                    },
                    "rdfs:subPropertyOf": [
                        {
                            "@id": "dcterms:created"
                        },
                        {
                            "@id": "schema:dateCreated"
                        }
                    ],
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Part of standard metadata for Publications"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1002/2013PA002534"
                    }
                },
                {
                    "@id": "schema:includedInDataCatalog",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#NonPeerReviewedPublication",
                    "@type": "owl:Class",
                    "owl:disjointWith": {
                        "@id": "http://linked.earth/ontology#PeerReviewedPublication"
                    },
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A publication that has not undergone a formal review process; for instance, a Dataset attached to a dissertation."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Non peer reviewed publication"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subclass of Publication.Allows to clearly mark datasets not generated as part of a peer-reviewed publication."
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasRank",
                    "@type": [
                        "owl:DatatypeProperty",
                        "owl:FunctionalProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the importance of the Interpretation?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Interpretation"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has rank"
                    },
                    "rdfs:range": {
                        "@id": "xsd:int"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to rank the environmental variable controlling the interpretation. For instance, the d18O of coral aragonite responds to both temperature and the d18O of seawater (closely linked to salinity). Depending on the locale and/or timescale, one variable may dominate over the other."
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.d18orub.Interpretation1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Bivalves",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Bivalves"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Mollusk"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#compilationDate",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: At what date was the Compilation created?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Compilation"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "compilation date"
                    },
                    "rdfs:range": {
                        "@id": "xsd:dateTime"
                    },
                    "rdfs:subPropertyOf": [
                        {
                            "@id": "schema:dateCreated"
                        },
                        {
                            "@id": "dcterms:created"
                        }
                    ],
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Separate compilation date from the publication year. An example is LR04 (datsetdate in 2004) but published in 2005"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ProxySensorModel",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A Model of the ProxySensor. Sensu Evans et al. (2013)"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.sciencedirect.com/science/article/pii/S0277379113002011"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Proxy sensor model"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "One component of the ProxySystemModel"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasISBN",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the international book number of the Publication?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has ISBN"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "dcterms:identifier"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Link to the ISBN: Identifier used commonly to refer to publications"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Microscope",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Microscope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Instrument"
                    }
                },
                {
                    "@id": "_:N7d682b6640cf4c05ae2fd8f7e604b457",
                    "@type": "owl:Class",
                    "owl:intersectionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Variable"
                            },
                            {
                                "@id": "http://purl.oclc.org/NET/ssnx/ssn#Observation"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#generatedByModel",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: which model was used to generated this data table?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#DataTable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "generated by model"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://www.w3.org/ns/prov#wasDerivedFrom"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Needed to link the model to the data tables it generates"
                    }
                },
                {
                    "@id": "http://earth.usc.edu/~khider/",
                    "@type": "owl:NamedIndividual"
                },
                {
                    "@id": "http://linked.earth/ontology#Historic",
                    "@type": [
                        "http://linked.earth/ontology#ProxyObservation",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Historic"
                    }
                },
                {
                    "@id": "vann:example",
                    "@type": "owl:AnnotationProperty"
                },
                {
                    "@id": "http://linked.earth/ontology#programmedIn",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which language was the software code written in?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#SoftwareCode"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "programmed in"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://ontosoft.org/software#hasImplementationLanguage"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Provides the user with information about the software"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Pyleoclim"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#OrganicIndex",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "<p>Paleoceanographers use the term <b>biomarker</b> to describe organic molecules found in <a href=\"/Category:MarineSediment\" title=\"Category:MarineSediment\"> marine sediments</a>, initially produced by a variety of organisms either on land or in the marine environment <sup id=\"cite_ref-rosell2007_1-0\" class=\"reference\"><a href=\"#cite_note-rosell2007-1\">[1]</a></sup>. A key characteristic of biomarkers is their ability to survive deposition in the <a href=\"/Category:ProxyArchive_%C2%A9\" title=\"Category:ProxyArchive Â©\"> archive</a> in terms of their original structure and steroidal configuration (i.e., spatial distribution of the atoms) <sup id=\"cite_ref-rosell2007_1-1\" class=\"reference\"><a href=\"#cite_note-rosell2007-1\">[1]</a></sup>. Their usefulness for paleoceanographic reconstructions largely depends on their <a href=\"/wiki/index.php?title=Degradation&amp;action=edit&amp;redlink=1\" class=\"new\" title=\"Degradation (page does not exist)\">degradation</a> within the <a href=\"/Category:ProxyArchive_%C2%A9\" title=\"Category:ProxyArchive Â©\"> archive</a> <sup id=\"cite_ref-rosell2007_1-2\" class=\"reference\"><a href=\"#cite_note-rosell2007-1\">[1]</a></sup>.<ol class=\"references\">\n<li id=\"cite_note-rosell2007-1\"><span class=\"mw-cite-backlink\">? <sup><a href=\"#cite_ref-rosell2007_1-0\">1.0</a></sup> <sup><a href=\"#cite_ref-rosell2007_1-1\">1.1</a></sup> <sup><a href=\"#cite_ref-rosell2007_1-2\">1.2</a></sup></span> <span class=\"reference-text\">Rosell-MelÃ©, A., &amp; McClymont, E. L. (2007). Biomarkers as Paleoceanographic proxies. Developments in Marine Geology, 1, 441-490. doi:10.1016/S1572-5480(07)01016-0 </span>\n</li>\n</ol>"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Organic index"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Chemical"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#deuteriumExcess",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#IsotopicComposition"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Deuterium excess (excessD)"
                    }
                },
                {
                    "@id": "_:Nb79a202e2b8f49aaadcb9bc9bff4c713",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#MeasuredVariable"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Model"
                            },
                            {
                                "@id": "http://linked.earth/ontology#PhysicalSample"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#PhysicalSample",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The actual sample on which the measurements are made. For instance, the lake core analyzed in the lab is the physical sample."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Physical sample"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Used to differentiate between the concept of a ProxyArchive and its physical (real) manifestation"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD98-2181"
                    }
                },
                {
                    "@id": "_:Nb2c27f351f1e412881f11c19bb1de648",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Compilation"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Data"
                            },
                            {
                                "@id": "http://linked.earth/ontology#ProxySystem"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#fundedBy",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What was the Funding source for the Dataset?"
                    },
                    "rdfs:domain": {
                        "@id": "_:N0a777b4ca54846b7a080b47718882fcd"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "funded by"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Funding"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "schema:funder"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links a dataset to its source of funding"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#temperature",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Temperature"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Thermodynamic property which quantifies how cold or warm an object, a fluid, or a substance is."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Temperature"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasMissingValue",
                    "@type": [
                        "owl:DatatypeProperty",
                        "owl:FunctionalProperty"
                    ],
                    "owl:propertyDisjointWith": {
                        "@id": "http://linked.earth/ontology#hasValue"
                    },
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: How are the missing values of the Variable identified in the DataTable?"
                    },
                    "rdfs:domain": {
                        "@id": "_:Nec46f2c1391a40a7ac51f49107b4a22c"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has missing value"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Useful for coding around the missing values"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#publishedIn",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which Publication was the Dataset or Compilation issued?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "published in"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the resource to its Publication"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014"
                    }
                },
                {
                    "@id": "_:N0a777b4ca54846b7a080b47718882fcd",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Compilation"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Dataset"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#palmerDroughtIndex",
                    "@type": [
                        "http://linked.earth/ontology#ClimateIndex",
                        "owl:NamedIndividual"
                    ],
                    "owl:sameAs": {
                        "@id": "http://linked.earth/ontology#palmerDroughtSeverityIndex"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Palmer Drought Index"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MoistureContent",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Physical"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Moisture Content"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Hydrology",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Hydrology"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#InferredVariable"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#InferredVariable",
                    "@type": "owl:Class",
                    "owl:disjointWith": {
                        "@id": "http://linked.earth/ontology#MeasuredVariable"
                    },
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A Variable that is inferred from one or more MeasuredVariable (s)"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://linked.earth/ontology/core/1.2.0"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Inferred variable"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "See InferredVariable Ontology for concept description."
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst"
                    }
                },
                {
                    "@id": "schema:author",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:author"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasMeanValue",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the mean value of the Variable?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has mean value"
                    },
                    "rdfs:range": {
                        "@id": "xsd:float"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "property relevant to facilitate queries, as in most cases the contents of a csv file are not directly represented"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst"
                    }
                },
                {
                    "@id": "_:N642899cf4ccf4f428d9d2f08bb678a6d",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#ChronModel"
                            },
                            {
                                "@id": "http://linked.earth/ontology#PaleoModel"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#UncertaintyModel",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A Model quantifiying the Uncertainty"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Uncertainty model"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows description of how uncertainty was calculated"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#northAtlanticOscillation",
                    "@type": [
                        "http://linked.earth/ontology#ClimateIndex",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "North Atlantic Oscillation (NAO)"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#southernAnnularMode",
                    "@type": [
                        "http://linked.earth/ontology#ClimateIndex",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Southern Annular Mode (SAM)"
                    }
                },
                {
                    "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#lat",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:domain": {
                        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#PaleoData",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The Data pertaining to past environmental variability"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Paleo data"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Data"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subdivision between chronological and paleoenvironmental information reflects the fact that Datasets are fundamentally characterized by two distinct components"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.PaleoData1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Mollusk",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Mollusk"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ICP-MS",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Inductively coupled plasma mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#IsotopeRatioMassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Data",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "An aggregation of DataTables and Models with their supporting paleoenvironmental and/or chronological information"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Data"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Needed to describe the paleoenvironmental and/or chronological data comprising the dataset as opposed to the Publication, Funding and Location information"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#d180",
                    "@type": [
                        "http://linked.earth/ontology#StableOxygenIsotope",
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#IsotopicComposition"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Oxygen has three naturally-occuring stable isotopes: 16O, 17O, 18O, with 16O being the most abundant (99.762%).\n\nTwo international reference standards are used to report variations in oxygen isotope standards: PDB and SMOW. The use of the PDB standard in reporting oxygen isotope composition is restricted to carbonates of low-temperature origins (e.g., oceanic, lacustrine ). The conversion between SMOW and PDB scales is given by:\n\\delta^{18}O_{SMOW} = 1.03091 (\\delta^{18}O_{PDB}) +30.91\n\nÎ´18O may be measured on the shells of foraminifera"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "d180"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#document",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Document"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Document"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#includesVariable",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which Variables are included in the DataTable?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#DataTable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "includes variable"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links DataTable to Variable"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ChronModel",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Model used to derive a time (or age) axis from the ChronDataModel"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Chron model"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subdivision between chronological and paleoenvironmental information reflects the fact that Datasets are fundamentally characterized by two distinct components"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.ChronData1.Model1"
                    }
                },
                {
                    "@id": "http://orcid.org/0000-0001-5920-4751",
                    "@type": "owl:NamedIndividual"
                },
                {
                    "@id": "http://linked.earth/ontology#peat",
                    "@type": [
                        "http://linked.earth/ontology#Peat",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Peat"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#chronModeledBy",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the ChronModel for the ChronData or ProxySystem under consideration?"
                    },
                    "rdfs:domain": {
                        "@id": "_:Nc4400976b3334c8c961247ed39ec43e9"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "chron modeled by"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#ChronModel"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://linked.earth/ontology#modeledBy"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subproperty of modeledBy. The subdivision between chronological and paleoenvironmental information reflects the fact that Datasets are fundamentally characterized by two distinct components"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasProxySystem",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the ProxySystem associated with this MeasuredVariable?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#MeasuredVariable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has proxy system"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#ProxySystem"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the MeasuredVariable to its ProxySystem. For instance, Mg/Ca measurements on foraminiferal shells have ProxySystem: MarineSediment.Foraminifera.Mg/Ca"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ChronDataTable",
                    "@type": "owl:Class",
                    "owl:disjointWith": {
                        "@id": "http://linked.earth/ontology#PaleoDataTable"
                    },
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "DataTable containing Variables pertaining to chronological information"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Chron data table"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#DataTable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subdivision between chronological and paleoenvironmental information reflects the fact that Datasets are fundamentally characterized by two distinct components"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.chron1measurement1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Funding",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Source of monetary support underlying the collection/creation/analysis/curation of the Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Funding"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to associate a grant number following U.S. federal regulation"
                    },
                    "vann:example": {
                        "@language": "en",
                        "@value": "http://wiki.linked.earth/MD982181.Khider.2014.Funding1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#includesData",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which Data are included in the Dataset?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "includes data"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Data"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links Dataset to Data"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasCode",
                    "@type": [
                        "owl:ObjectProperty",
                        "owl:FunctionalProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What SoftwareCode was used to generate the Model output?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has code"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#SoftwareCode"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links a Model to its SoftwareCode."
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#includesChronData",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which ChronData are included in the Dataset?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "includes chron data"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#ChronData"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://linked.earth/ontology#includesData"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subproperty of includesData. The subdivision between chronological and paleoenvironmental information reflects the fact that Datasets are fundamentally characterized by two distinct components"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#foundInMeasurementTable",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which MeasurementTable are the Variables found?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Data"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "found in measurement table"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#MeasurementTable"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://linked.earth/ontology#foundInTable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subproperty of foundinTable to link the Data to the Variables"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.PaleoData1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#IntegrationTime",
                    "@type": "owl:Class",
                    "rdfs:comment": "The time it takes for the ProxySensor to imprint environmental information on the ProxyArchive. It may be further qualified with time periods and units",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Integration time"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Soilwater mixing above speleothems: Although the sample might only represent 5 years of calcification, it can record 30 years of water mixing."
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Al/Ca",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#TraceElement"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Al/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Resolution",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Refers to the time difference between two adjacent values of a Variable."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Resolution"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Class added to describe the annual resolution of the archives"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Fe/Ca",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#TraceElement"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Fe/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Isotope",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "<p>Atoms can be simply described as consisting of <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Proton\">protons</a>, <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Electron\">electrons</a>, and <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Neutron\">neutrons</a>. Isotopes of the same element differ by the number of neutrons in the nucleus, resulting in different mass.\n</p>"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Isotope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Chemical"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#PeerReviewedPublication",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A Publication that has undergone a formal peer-review process"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Peer reviewed publication"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subclass of Publication.Allows to clearly mark datasets generated as part of a peer-reviewed publication."
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1002/2013PA002534"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#inferredVariableType",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What type of InferredVariable does the InferredVariable belongs to?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#InferredVariable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "inferred variable type"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#InferredVariable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the InferredVariable values to their type. For instance, the value of 29.1 degC is of type SST. This is important to normalize the variations in VariableNames (e.g. SST, sst, sea-surface temp)"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Floral",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Assemblage"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Floral"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Chironomids",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Chironomids"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#equation",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the mathematical formulation of the Model?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "equation"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to provide the equation as part of the metadata"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982176.Stott.2004.paleo1measurement1.Mg/Ca-g.rub.Calibration"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Zn/Ca",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#TraceElement"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Zn/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#carbonDioxideConcentration",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#AtmosphericChemistry"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Carbon dioxide concentration"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Variable",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Quantities that may change from value to value. They are usually represented as column of values in a data table"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Variable"
                    },
                    "vaem:rationale": [
                        {
                            "@language": "en",
                            "@value": "Basic definition of the values in the columns of the csv file"
                        },
                        {
                            "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst"
                        }
                    ]
                },
                {
                    "@id": "http://linked.earth/ontology#Peat",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Peat "
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasFileName",
                    "@type": [
                        "owl:DatatypeProperty",
                        "owl:FunctionalProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the name of the csv file in which the Variable values are stored?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#DataTable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has file name"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links a DataTable with its appropriate csv file"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2"
                    }
                },
                {
                    "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing",
                    "@type": "owl:Class",
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Mg/Ca",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#TraceElement"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Mg/Ca"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Radiocarbon",
                    "@type": [
                        "http://linked.earth/ontology#Radioisotope",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Radiocarbon"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#detail",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the  \"of what\" question for an Interpretation. For intance, sea surface in sea surface temperature."
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Interpretation"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "detail"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.Interpretation"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#rock",
                    "@type": [
                        "http://linked.earth/ontology#Rock",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Rock"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#calibratedVia",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What calibration process was used to relate the InferredVariable to the MeasuredVariable?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#InferredVariable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "calibrated via"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#CalibrationModel"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Provides calibration information, especially useful for legacy datasets where the raw measurements may not be available and for comparison of datasets."
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Faunal",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Assemblage"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Faunal"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#d15N",
                    "@type": [
                        "http://linked.earth/ontology#StableNitrogenIsotope",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "d15N"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Nino1Plus2",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#ElNinoIndex"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Nino 1+2"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#takenAtDepth",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: At which depth in the ProxyArchive is the Variable measured or inferred?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "taken at depth"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Provides depth information. Can link to the depth Variable in the DataTable"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.mgcarub"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#StableIsotope",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Stable isotope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Isotope"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#lakeSediment",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#LakeSediment"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Lake sediment"
                    }
                },
                {
                    "@id": "vaem:rationale",
                    "@type": "owl:AnnotationProperty"
                },
                {
                    "@id": "http://linked.earth/ontology#pH",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#OceanChemistry"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "PH"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Si",
                    "@type": [
                        "http://linked.earth/ontology#MajorElement",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Si"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasValue",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What are the numerical values of the Variable, Uncertainty, and Model outputs?"
                    },
                    "rdfs:domain": {
                        "@id": "_:N85e2e85c5d1c491d92a8d06fdd160503"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has value"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Useful if there is only a single value rather than a vector of numbers. Often the case for analytical uncertainty or uncertainty reported as a RMSE"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.d18orub.Uncertainty"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Uk37Prime",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#OrganicIndex"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The currently accepted U37kprime (Prahl and Wakeman, 1987) varies positively with temperature, and is defines as C(37:2)/(C(37:2)+C(37:3), where C(37:2) represents the quantity of the di-unsaturated ketone and C(37:3) the quantity of the tri-unsaturated form.\n\nHerbet, T.D., 2003, Alkenone paleotemperature determinations in Treatise on Geochemistry, Volume 6, pp 391-432"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Uk 37'"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#AcceleratorMassSpectrometerInstrument",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Accelerator mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#AcceleratorMassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Spectral",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Spectral observation"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyObservation"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#distributionTableGeneratedByModel",
                    "@type": [
                        "owl:FunctionalProperty",
                        "owl:ObjectProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which DistributionTable is the Model output found?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#DistributionTable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "distribution table generated by Model"
                    },
                    "rdfs:range": {
                        "@id": "_:N487c524212ea4211b73d8c6662b8645f"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://linked.earth/ontology#generatedByModel"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "\"Subproperty of foundinTable to Link the Model to its outputs\""
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/ODP1098B1_2.ChronData1.Model1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Physical",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Physical observation"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyObservation"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#SIMS",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Secondary ion mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#SecondaryIonMassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#measuredOn",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: On which PhysicalSample was the MeasuredVariable measured?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#MeasuredVariable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "measured on"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#PhysicalSample"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "owl:topObjectProperty"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the MeasuredVariable to the ProxyArchive. Refers to the specific archive (i.e. the specific coral head, lake sediment...) and a specific Variable since ProxyArchive provides a link to the ProxySensor. In some instances, two MeasuredVariables on the same PhysicalSample may have different ProxyArchive page. This would be the case for measurements on various species of foraminifera in a MarineSediment"
                    },
                    "vann:example": [
                        {
                            "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.d18omund"
                        },
                        {
                            "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.mgcarub"
                        }
                    ]
                },
                {
                    "@id": "http://linked.earth/ontology#julianDay",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Time"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Julian day"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#fundingCountry",
                    "@type": [
                        "owl:FunctionalProperty",
                        "owl:DatatypeProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which nation funded the Dataset?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Funding"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "funding country"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": [
                        {
                            "@id": "http://wiki.linked.earth/MD982181.Khider.2014.Funding1"
                        },
                        {
                            "@language": "en",
                            "@value": "Provides information about the country the agency is from"
                        }
                    ]
                },
                {
                    "@id": "foaf:Person",
                    "@type": "owl:Class",
                    "rdfs:isDefinedBy": {
                        "@id": "foaf:"
                    }
                },
                {
                    "@id": "schema:DataCatalog",
                    "@type": "owl:Class",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Dataset",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A structured collection of related information, including -but not limited to -measured and/or modelled geograhical, chronological, and environmental data"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Dataset"
                    },
                    "rdfs:subClassOf": {
                        "@id": "schema:Dataset"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Fundamental unit at which we think about paleoclimate data. Also tends to correspond to the scope of the study"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Sclerosponge",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Sclerosponge"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#surfaceAirTemperature",
                    "@type": [
                        "http://linked.earth/ontology#Temperature",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Surface air temperature"
                    }
                },
                {
                    "@id": "http://www.opengis.net/ont/geosparql#Feature",
                    "@type": "owl:Class",
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.opengis.net/ont/geosparql"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Vegetation",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Vegetation"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#moistureContent",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Hydrology"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Moisture content"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Polyp",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Polyp"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#GasChromatograph",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Gas chromatograph"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Instrument"
                    }
                },
                {
                    "@id": "schema:citation",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Fluorescence",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Fluorescence"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Spectral"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#standard",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Reference material against which the MeasuredVariable is reported?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#MeasuredVariable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "standard"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Crucial for isotopic measurements (for instance, d18O measurements (VSMOW vs VPDB))"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.d18Og.rub-w.v"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasUnits",
                    "@type": [
                        "owl:FunctionalProperty",
                        "owl:DatatypeProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In what unit of measure is (are) the Variable(s) expressed?"
                    },
                    "rdfs:domain": {
                        "@id": "_:Ne3f67c67918c4f1f8f1d157de742dbf5"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has units"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the units and the values of the Variable"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.d18orub"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Location",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The geographic data and metadata for the dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Location"
                    },
                    "rdfs:subClassOf": [
                        {
                            "@id": "schema:Place"
                        },
                        {
                            "@id": "http://www.opengis.net/ont/geosparql#Feature"
                        },
                        {
                            "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing"
                        }
                    ],
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Gives information about where the ProxyArchive comes from."
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.Location"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MC-ICP-MS",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Multi-collector (MC) Inductively coupled plasma mass spectrometry (ICPMS)"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#IsotopeRatioMassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#",
                    "@type": [
                        "owl:Ontology",
                        "owl:NamedIndividual"
                    ],
                    "dcterms:contributor": [
                        {
                            "@id": "http://www.isi.edu/~gil/"
                        },
                        {
                            "@id": "http://w3id.org/people/dgarijo"
                        }
                    ],
                    "dcterms:creator": [
                        {
                            "@id": "http://earth.usc.edu/~khider/"
                        },
                        {
                            "@id": "http://www.cefns.nau.edu/~npm4/"
                        },
                        {
                            "@id": "http://orcid.org/0000-0001-5920-4751"
                        }
                    ],
                    "dcterms:description": {
                        "@language": "en",
                        "@value": "The Linked Earth Ontology aims to provide a common vocabulary for annotating paleoclimatology data"
                    },
                    "dcterms:license": [
                        "http://creativecommons.org/licenses/by/2.0/",
                        {
                            "@id": "http://creativecommons.org/licenses/by/2.0/"
                        }
                    ],
                    "dcterms:title": {
                        "@language": "en",
                        "@value": "The Linked Earth Ontology"
                    },
                    "owl:versionInfo": {
                        "@language": "en",
                        "@value": "1.2.0"
                    },
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The Linked Earth Ontology aims to provide a common vocabulary for annotating paleoclimatology data"
                    },
                    "vann:preferredNamespacePrefix": "le",
                    "vann:preferredNamespaceUri": "http://linked.earth/ontology#"
                },
                {
                    "@id": "http://linked.earth/ontology#contributor",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Who contributed the resource? A contributor may be the same as the authors of the resource or different. For instance, in the case of a legacy dataset, a Linked Earth member may contribute a previously-published dataset that he/she may not have authored"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "contributor"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Person"
                    },
                    "rdfs:subPropertyOf": [
                        {
                            "@id": "schema:contributor"
                        },
                        {
                            "@id": "dcterms:contributor"
                        }
                    ],
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows distinction between contributor to a resource and the author"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#GlacierIce",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Glacier ice"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#alt",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:domain": {
                        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "owl:topDataProperty"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasMaxValue",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the maximum value of the Variable?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has max value"
                    },
                    "rdfs:range": {
                        "@id": "xsd:float"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "property relevant to facilitate queries, as in most cases the contents of a csv file are not directly represented"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement2.sst"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#StableHydrogenIsotope",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Stable Hydrogen isotope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#StableIsotope"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#salinity",
                    "@type": [
                        "http://linked.earth/ontology#OceanChemistry",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Salinity"
                    }
                },
                {
                    "@id": "schema:Place",
                    "@type": "owl:Class",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#proxyObservationModel",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which ProxyObservationModel is used in the ProxySystemModel?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#ProxySystemModel"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "proxy observation model"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#ProxyObservationModel"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links ProxySystemModel to ProxyObservationModel"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#SecondaryIonMassSpectrometer",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Secondary ion mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#MassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#NOSAMSTandetron",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "NOSAMS tandetron"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#AcceleratorMassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#speleothem",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Speleothem"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Speleothem"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#proxyArchiveModel",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which ProxyArchiveModel is used in the ProxySystemModel?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#ProxySystemModel"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "proxy archive model"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#ProxyArchiveModel"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links ProxySystemModel to ProxyArchiveModel"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#GC-IR-MS",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Gas Chromatography - Isotope ratio -Mass Spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#GasChromatographyMassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Color",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Physical"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Color"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#OrganicMatter",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Chemical"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Organic matter"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Ar-Ar",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Radioisotope"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Ar-Ar"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Uk37",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#OrganicIndex"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The C37 alkenone unsaturation index ( U_{37}^{k'} ) is a firmly established tool for past sea surface temperatures reconstruction and is based on the relative abundance of di- (C37:2) and tri- (C37:3) unsaturated ketones with 37 carbon atoms. The index varies between 0 and 1, thus it may saturate in the temperature extremes as it becomes more challenging to determine since C37:3 and C37:2 alkenones approach their detection limits. Since alkenones come exclusively from a few species of haptophyte algae which require sunlight, alkenone thermometry offers the advantage of direct estimate of near-surface ocean temperatures. The ubiquitous presence of alkenone-synthesizing organisms (most commonly the coccolithophorids Emiliania huxleyi and Gephyrocapsa oceanic through the world's ocean and the rapidity and high-precision of the alkenone analyses had made U_{37}^{k'} a valuable proxy for paleoceanographic reconstructions.\n\nHowever, the U_{37}^{k'} proxy is subject to non-temperature effects, such as lateral transport through oceanic currents (Ohkouchi et al. (2002)) and preferential post-depositional oxidation of C37:3 compared to C37:2 [1] [2]. Furthermore, changes in the seasonality of the proxy (i.e., which part of the seasonal cycle the proxy is recording) may bias the inferred temperatures toward winter or summer conditions [3]. Finally in oceanic regions where the photic zone extends below the surface mixed layer, the sedimentary signal may not strictly represent sea surface temperatures but rather a composite temperature of the mixed layer and the thermocline [4][5].\nReferences\n\n[1] Hoefs, M. J. L., Versteegh, G. J. M., Rijpstra, W. I. C., de Leeuw, J. W., & DamstÃ©, J. S. S. (1998). Postdepositional oxic degradation of alkenones: Implications for the measurement of palaeo sea surface temperatures. Paleoceanography, 13(1), 42-49. doi:10.1029/97pa02893\n\n[2] Ohkouchi, N., Eglinton, T. I., Keigwin, L. D., & Hayes, J. M. (2002). Spatial and temporal offsets between proxy records in a sediment drift. Science, 298(5596), 1224-1227. doi:10.1126/science.1075287\n\n[3] Herfort, L., Schouten, S., Boon, J. P., & Sinninghe DamstÃ©, J. S. (2006). Application of the TEX86 temperature proxy in the southern North Sea. Organic Geochemistry, 37, 1715-1726.\n\n[4] MÃ¼ller, P. J., Kirst, G., Ruhland, G., von Storch, I., & Rosell-MelÃ©, A. (1998). Calibration of the alkenone paleotemperature index U_{37}^{k'} based on core-tops from the eastern South Atlantic and the global ocean (60Â°N-60Â°S). Geochimica et cosmochimica acta, 62, 1757-1772.\n\n[5] Prahl, F. G., Mix, A. C., & Sparrow, M. A. (2006). Alkenone paleothermometry: biological lessons from amrine sediment records off Western South America. Geochimica and Cosmochimica Acta, 70, 101-117."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Uk37"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#nino3_4",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#ElNinoIndex"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Nino 3.4"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasExecutionCommand",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the command to run the script or the code?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#SoftwareCode"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has execution command"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to store the execution command of a script"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#interpretationReferences",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which Publication(s) is the Interpretation substantiated?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Interpretation"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "interpretation references"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "dcterms:references"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links an interpretation to a reference citation (can be the same as the calibrationReferences for a Dataset)"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.Calibration"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#AtmosphericChemistry",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Atmospheric chemistry"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#InferredVariable"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#SummaryTable",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A DataTable that contains summary information for the Variable and is output from a Model."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Summary table"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#DataTable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to represent a summary of basic statistics such as median, mean, standard deviation, and various quantiles from the output of the Model"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1model1summary1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasIntegrationTime",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the integration time needed for a ProxySensor to imprint environmental information on the ProxyArchive? Both are included as part of a ProxySystem"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#ProxySensor"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has integration time"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#IntegrationTime"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Property added to link the proxySystem to the IntegrationTime class"
                    }
                },
                {
                    "@id": "dcterms:contributor",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "dcterms:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ClimateIndex",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Climate index"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#InferredVariable"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasDOI",
                    "@type": [
                        "owl:DatatypeProperty",
                        "owl:FunctionalProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the digital object identifier associated with the resource?"
                    },
                    "rdfs:domain": {
                        "@id": "_:N7b16209ac5ab44f0a4334d922305c6ce"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has DOI"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "dcterms:identifier"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to link to a resource using a digital object identifier"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1002/2013PA002534"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#proxySensorModel",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: Which ProxySensorModel is used in the ProxySystemModel?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#ProxySystemModel"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "proxy sensor model"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#ProxySensorModel"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links ProxySystemModel to ProxySensorModel"
                    }
                },
                {
                    "@id": "dcterms:created",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "dcterms:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasVariableID",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the unique identifier for the Variable?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has variable ID"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "dcterms:identifier"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "LiPD assigns a unique identifier (TSid) to each table column described in a LiPD file.\n\nAllows to assign a unique identifier to each series, facilitating data citation and recognition\n\nThis allows someone to change every piece of metadata about column or dataset, including its names (both dataset and variable) and still get back to the right spot. Itâ€™s fundamental to working with LiPD data."
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#issue",
                    "@type": [
                        "owl:DatatypeProperty",
                        "owl:FunctionalProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In what issue of the journal can the resource be found?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "issue"
                    },
                    "rdfs:range": {
                        "@id": "xsd:int"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Part of standard metadata for Publications"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1002/2013PA002534"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasMedianValue",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the median value of the Variable?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has median value"
                    },
                    "rdfs:range": {
                        "@id": "xsd:float"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "property relevant to facilitate queries, as in most cases the contents of a csv file are not directly represented"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.ICPAES"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#oceanMixedLayerTemperature",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Temperature"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Ocean mixed layer temperature"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Person",
                    "@type": "owl:Class",
                    "owl:equivalentClass": [
                        {
                            "@id": "schema:Person"
                        },
                        {
                            "@id": "foaf:Person"
                        }
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "An individual who has participated directly or indirectly in the authoring of any resources on the LinkedEarth wiki"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Person"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "The researcher, author on a publication."
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/D._Khider"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#isLocal",
                    "@type": [
                        "owl:FunctionalProperty",
                        "owl:DatatypeProperty"
                    ],
                    "rdfs:comment": "Answers the question: Does the Interpretation describe local variability, or far-field variability that may not reflect local conditions?",
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Interpretation"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "is local"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Added to allow data analysis. Is the interpretation relevant to these coordinates? Does putting a colored dot on the map here make sense?"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#X-RayDiffraction",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Diffraction"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "X-Ray diffraction"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#d34S",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#StableSulfurIsotope"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "d34S"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MassSpectrometerInstrument",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#MassSpectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#southernOscillationIndex",
                    "@type": [
                        "http://linked.earth/ontology#ElNinoIndex",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Southern oscillation index (SOI)"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Compilation",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A curated aggregation of datasets"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Compilation"
                    },
                    "rdfs:subClassOf": {
                        "@id": "schema:DataCatalog"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Encodes what Data/Metadata gathering effort/scientific project led to the curation of the Datasets. Examples: PAGES2k, Iso2k, LR04, OC3, MARGO"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ZeissPetrographicMicroscope",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Zeiss petrographic microscope"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Microscope"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#GCMS",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Gas chromatography mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#GasChromatographyMassSpectrometer"
                    }
                },
                {
                    "@id": "schema:contentLocation",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#scope",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: how would you classify the Interpretation? Examples include Isotope, Climateâ€¦"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Interpretation"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "scope"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to separate the various types of interpretation"
                    }
                },
                {
                    "@id": "dcterms:title",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "dcterms:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#TEX86",
                    "@type": [
                        "http://linked.earth/ontology#OrganicIndex",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The use of TEX86 (TetraEther indeX of 86 carbons) as a tool to reconstruct past sea surface temperature variability is based on the relative cyclization of isoprenoidal glycerol dialkyl glycerol tetra ethers (GDGTs) produced by marine archaea. TEX86 is defined as [1]:\n\nTEX_{86}=\\frac{GDGT-2+GDGT-3+Cren'}{GDGT-1+GDGT-2+GDGT-3+Cren'}\n\nwhere GDGTs 1-3 indicate compounds containing 1-3 cyclopentyl moieties, respectively, and Cren' denotes the regioisomer of crenarchaeol, a diagnostic biomarker for the Thaumarchaeota, the primary producers of GDGTs in the marine realm. By definition, values of the TEX86 index are comprised between 0 and 1.\n\nExperimental evidence suggests that archaea produce GDGTs with more rings warmer waters, a response observed in cultures of hyperthermophile archaea [2] [3] and mesocosm experiments with natural seawater containing heterogenous archaeal population [4] [5].\nReferences\n\n[1] Schouten, S., Hopmans, E. C., SchefuÃŸ, E., & Sinninghe DamstÃ©, J. S. (2002). Distributional variations in marine crenarchaeotal membrane lipids: a new organic proxy for reconstructing ancient sea water temperatures? . Earth and Planetary Science Letters, 204, 265-274.\n\n[2] de Rosa, M., Esposito, E., Gambacorta, A., Nicolaus, B., & Bu'Lock, J. (1980). Effects of temperature on ether lipid composition of Caldariella acidophilia. Phytochemistry, 19, 827-831.\n\n[3] Uda, I., Sugai, A., Itoh, Y., & Itoh, T. (2001). Variation in molecular species of polar liipds from Thermoplasma acidophilum depends on growth temperature. Lipids, 36, 103-105.\n\n[4] Wuchter, C., Schouten, S., Coolen, M. J. L., & Sinninghe DamstÃ©, J. S. (2004). Temperature-dependent variation in the distribution of tetraether membrane lipids of marine Crenarchaeota: implications for TEX86 paleothermometry. Paleoceanography, 19, PA4028. doi:10.1029/2004PA001041\n\n[5]Schouten, S., Forster, A., Panato, E., & Sinninghe DamstÃ©, J. S. (2007). Towards the calibration of the TEX86 paleothermometer on ancient greenhouse worlds. Organic Geochemistry. doi:10.1016/j.orggeochem.2007.05.014"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "TEX86"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#book",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which book was the resource published?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "book"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Separate between journal and book publication"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Rock",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Rock"
                    },
                    "rdfs:subClassOf": [
                        {
                            "@id": "http://linked.earth/ontology#ProxyArchive"
                        },
                        {
                            "@id": "http://linked.earth/ontology#InorganicProxySensor"
                        }
                    ]
                },
                {
                    "@id": "http://linked.earth/ontology#Interpretation",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "A suite of metadata that describes which phenomena drove variability in this Variable (e.g. environmental drivers)."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Interpretation"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Used to describe the interpretation of the Variable. For instance, radiocarbon is interpreted to represent age"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.Interpretation"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#molluskShells",
                    "@type": [
                        "http://linked.earth/ontology#MolluskShells",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Mollusk shells"
                    }
                },
                {
                    "@id": "rdfs:Literal",
                    "owl:equivalentClass": {
                        "@id": "xsd:string"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Permeability",
                    "@type": [
                        "http://linked.earth/ontology#Physical",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Permeability"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#email",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the email address of the Person?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Person"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "email"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allow to store contact information"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/D._Khider"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#precipitationAmount",
                    "@type": [
                        "http://linked.earth/ontology#Precipitation",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Precipitation amount"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#seasonality",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: To which part of the year is the Interpretation or ProxySensor restricted to? Acceptable answers may be \"MJJA\", \"growing season\",or [5,6,7,8]"
                    },
                    "rdfs:domain": {
                        "@id": "_:N926e32fc2b584c2ca20c32fa63866286"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "seasonality"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Seasonality is critical to properly related measuredVariable and innferredVariable, as the former only senses part of the range of the latter."
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Ocean2kHR_119.d18O.ClimateInterpretation"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#sensorSpecies",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the species of the Organic ProxySensor?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#OrganicProxySensor"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "sensor species"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Scientific Name of the organic ProxySensor"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Globigerinoides_ruber"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#calibrationReferences",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In what Reference(s) is the Calibration described/justified?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#CalibrationModel"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "calibration references"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "dcterms:references"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Relationship needed to link to a Publication desribing the calibration being applied to the dataset"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.Calibration"
                    }
                },
                {
                    "@id": "_:N7d3ff3f7ade2446d937b10cfe9f3a5e8",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#PaleoData"
                            },
                            {
                                "@id": "http://linked.earth/ontology#ProxySystem"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#OrganicProxySensor",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Biologically-mediated ProxySensor. Examples include: foraminifera, trees, mollusks, polyps"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://linked.earth/ontology/core/"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Organic proxy sensor"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxySensor"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subclass of ProxySensor. Makes the distinction between organic and inorganic. See the ProxySensor ontology for concepts"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Globigerinoides_ruber"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasLink",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the universal resource locator to a resource?"
                    },
                    "rdfs:domain": {
                        "@id": "owl:Thing"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has link"
                    },
                    "rdfs:range": {
                        "@id": "xsd:anyURI"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to point to the original source of a resource"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1002/2013PA002534"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Temperature",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Thermodynamic property allowing to quantitatively measure how warm or cold a material, fluid is."
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Temperature"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#InferredVariable"
                    }
                },
                {
                    "@id": "_:N04e57699f5d946f4b42475aa595572b6",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Data"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Variable"
                            }
                        ]
                    }
                },
                {
                    "@id": "_:Nbab0ec35d4e044ddbefb12e9bab3a98f",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Hydrology"
                            },
                            {
                                "@id": "http://linked.earth/ontology#OceanChemistry"
                            }
                        ]
                    }
                },
                {
                    "@id": "schema:dateCreated",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MeasurementTable",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "DataTable that contains the Variables (both measured and inferred)"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Measurement table"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#DataTable"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subclass of DataTable. Allows InferredVariables (despite the name) for practical purposes"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#age",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Time"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The age of a sample"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Age"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ProxySystemModel",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "In the Evans et al. (2013) framework, this is the combination of sensor, archive and observation models . \"A generalized proxy system model encapuslates a simplified representation of prior physical, chemical, biological, and/or geological understanding of the ways in which environmental variation ultimately results in the observations used to retrieve paleoclimatic information.\""
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.sciencedirect.com/science/article/pii/S0277379113002011"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Proxy system model"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "We adopted the Evans et al. (2013) framework since this is the only published definition of what is most commonly referred to as \"proxy\" in the paleoclimate community"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#IsotopeRatioMassSpectrometer",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Isotope ratio mass spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#MassSpectrometer"
                    }
                },
                {
                    "@id": "_:N487c524212ea4211b73d8c6662b8645f",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#ChronModel"
                            },
                            {
                                "@id": "http://linked.earth/ontology#PaleoModel"
                            }
                        ]
                    }
                },
                {
                    "@id": "_:N926e32fc2b584c2ca20c32fa63866286",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Interpretation"
                            },
                            {
                                "@id": "http://linked.earth/ontology#ProxySensor"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#modeledBy",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the Model for the Data, Compilation or ProxySystem under consideration?"
                    },
                    "rdfs:domain": {
                        "@id": "_:Nb2c27f351f1e412881f11c19bb1de648"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "modeled by"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Model"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links Data, Compilation or ProxySystem to Model"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#MolluskShells",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Mollusk shells"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasUncertainty",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the Uncertainty associated with the Variable, Model, or Instrument?"
                    },
                    "rdfs:domain": {
                        "@id": "_:Nc39b75cbf8334f9d9e7f1e87d2232b5e"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has uncertainty"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Uncertainty"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links to the Uncertainty class"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#grantNumber",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the unique identifier associated with the Funding for the Dataset?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Funding"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "grant number"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Provides information about the grant number"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.Funding1"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasIGSN",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "IGSN identifier associated to a physical sample"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#PhysicalSample"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has IGSN"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "dcterms:identifier"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Needed to properly described physical samples"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#IceSheet",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Ice sheet"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#InorganicProxySensor"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#bottomWaterTemperature",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Temperature"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Bottom water temperature"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Wood",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "<p>The field of <a rel=\"nofollow\" class=\"external text\" href=\"https://en.wikipedia.org/wiki/Dendroclimatology\">dendroclimatology</a> and, to some extent, the field of <a href=\"/Dendrochronology\" title=\"Dendrochronology\"> dendrochronology</a> have played an important role in generating climate reconstructions of the past millennium <sup id=\"cite_ref-1\" class=\"reference\"><a href=\"#cite_note-1\">[1]</a></sup> <sup id=\"cite_ref-2\" class=\"reference\"><a href=\"#cite_note-2\">[2]</a></sup> <sup id=\"cite_ref-3\" class=\"reference\"><a href=\"#cite_note-3\">[3]</a></sup> <sup id=\"cite_ref-4\" class=\"reference\"><a href=\"#cite_note-4\">[4]</a></sup>. In regions with large seasonal variations, trees produce rings of varying color depending on the species. In most cases, the rings shift from a lighter, low density early wood of spring and early summer to a darker, denser band of late wood at the end of the growing season. The growing season generally occurs during the summer month and its length depends on the species, latitude, and altitude. Therefore, trees  hold perhaps the greatest potential for reconstructing past terrestrial climates at annual or even sub-annual resolution. \n</p><p>The following observations can be made on the wood archive:\n</p>\n<ul><li> Tree ring width</li>\n<li> Wood density</li>\n<li> Stables isotopes<ol class=\"references\"></li></ul><ol>\n<li id=\"cite_note-1\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-1\">?</a></span> <span class=\"reference-text\"> Mann, M. E., Bradley, R. S., &amp; Hughes, M. K. (1998). Global-scale temperature patterns and climate forcing over the past six centuries. Nature, 392(6678), 779-787. doi:10.1038/33859 </span>\n</li>\n<li id=\"cite_note-2\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-2\">?</a></span> <span class=\"reference-text\">Mann, M. E., Bradley, R. S., &amp; Hughes, M. K. (1999). Northern Hemipshere temperatures during the past millennium: Inferences, Uncertainties, and Limitations. Geophysical Research Letters, 26(6), 759. </span>\n</li>\n<li id=\"cite_note-3\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-3\">?</a></span> <span class=\"reference-text\">Moberg, A., Sonechkin, D. M., Holmgren, K., Datsenko, N. M., &amp; Karlen, W. (2005). Highly variable Northern Hemisphere temperatures reconstructed from low- and high-resolution proxy data. Nature, 433(7026), 613-617. doi:10.1038/nature03265</span>\n</li>\n<li id=\"cite_note-4\"><span class=\"mw-cite-backlink\"><a href=\"#cite_ref-4\">?</a></span> <span class=\"reference-text\">Mann, M. E., Zhang, Z., Rutherford, S., Bradley, R., Hughes, M. K., Shindell, D. T., . . . Ni, F. (2009). Global signatures and dynamical origins of the Little Ice Age and Medieval Climate Anomaly. Science, 326, 1256-1260. dos: 10.1126/science.1177303</span>\n</li>\n</ol>"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Wood"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://ontosoft.org/software#Software",
                    "@type": "owl:Class",
                    "rdfs:isDefinedBy": {
                        "@id": "http://ontosoft.org/software#"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#relevantQuote",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": "Answers the question: Which part of the publication describes the Calibration or Interpretation?",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "relevant quote"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://linked.earth/ontology#description"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Often it's useful to put a quote from the paper that describes the interpretation"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Ocean2kHR_119.d18O.ClimateInterpretation"
                    }
                },
                {
                    "@id": "_:N85e2e85c5d1c491d92a8d06fdd160503",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#Model"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Uncertainty"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Variable"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#EnergyDispersiveSpectrometer",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Energy dispersive spectrometer"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#Spectrometer"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Lithics",
                    "@type": [
                        "http://linked.earth/ontology#Physical",
                        "owl:NamedIndividual"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Lithics"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#uncertaintyLevel",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What parameter of the error distribution is the Uncertainty value referring to?\n\nExamples include 1-sigma, 2-sigma, 95% confidence bounds"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Uncertainty"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "uncertainty level"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to properly make use of the reported Uncertainty values"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.d18orub.Uncertainty"
                    }
                },
                {
                    "@id": "http://purl.oclc.org/NET/ssnx/ssn#observedBy",
                    "@type": "owl:ObjectProperty",
                    "rdfs:isDefinedBy": {
                        "@id": "http://purl.oclc.org/NET/ssnx/ssn#"
                    }
                },
                {
                    "@id": "schema:Dataset",
                    "@type": "owl:Class",
                    "rdfs:isDefinedBy": {
                        "@id": "schema:"
                    }
                },
                {
                    "@id": "_:Ne5f4037fb4b34b5ea322a2d483b8eaf0",
                    "@type": "owl:Class",
                    "owl:unionOf": {
                        "@list": [
                            {
                                "@id": "http://linked.earth/ontology#DataTable"
                            },
                            {
                                "@id": "http://linked.earth/ontology#Variable"
                            }
                        ]
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Speleothem",
                    "@type": "owl:Class",
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Speleothem"
                    },
                    "rdfs:subClassOf": {
                        "@id": "http://linked.earth/ontology#ProxyArchive"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#summaryTableGeneratedByModel",
                    "@type": [
                        "owl:FunctionalProperty",
                        "owl:ObjectProperty"
                    ],
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which SummaryTable can the statistics on the Model Output be found?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#SummaryTable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "summary table generated by model"
                    },
                    "rdfs:range": {
                        "@id": "_:Ncf059e502c8a4a519d6025b23d8f7197"
                    },
                    "rdfs:subPropertyOf": {
                        "@id": "http://linked.earth/ontology#generatedByModel"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Subproperty of foundinTable to link the Model to its outputs"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/MD982181.Khider.2014.PaleoData1.Model1"
                    }
                },
                {
                    "@id": "http://www.opengis.net/ont/geosparql#hasGeometry",
                    "@type": "owl:ObjectProperty",
                    "rdfs:domain": {
                        "@id": "http://www.opengis.net/ont/geosparql#Feature"
                    },
                    "rdfs:isDefinedBy": {
                        "@id": "http://www.opengis.net/spec/geosparql/1.0"
                    },
                    "rdfs:range": {
                        "@id": "http://www.opengis.net/ont/geosparql#Geometry"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasExecutionEnvironment",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: In which environment is the script meant to be run in?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#SoftwareCode"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has execution environment"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Provides information about the operating system version in which the software code was exceuted?"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#hasResolution",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": "Answers the question: What is the Resolution of the Variable?",
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Variable"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "has resolution"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Resolution"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Needed to link a Variable to Resolution"
                    },
                    "vann:example": {
                        "@language": "en",
                        "@value": "http://wiki.linked.earth/MD982181.Khider.2014.paleo1measurement1.mgcarub.ICPAES"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#journal",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: What is the name of the journal in which the resource can be found?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Publication"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "journal"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Part of standard metadata for Publications"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/Publication.10.1002/2013PA002534"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#Neodymium",
                    "@type": [
                        "owl:NamedIndividual",
                        "http://linked.earth/ontology#Radioisotope"
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Neodymium"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#ProxyObservation",
                    "@type": "owl:Class",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "The type of MeasuredVariables measured on the ProxyArchive, whether chemical (e.g. Mg/Ca, D18O, Sr/Ca), physical (e.g. density, layer thickness), or biological (e.g. Species abundance)"
                    },
                    "rdfs:isDefinedBy": [
                        {
                            "@id": "http://linked.earth/ontology/core/1.2.0/"
                        },
                        {
                            "@id": "http://www.sciencedirect.com/science/article/pii/S0277379113002011"
                        }
                    ],
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "Proxy observation"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "See ProxyObservation ontology for details about the concept. \n\nWe adopted the Evans et al. (2013) framework since this is the only published definition of what is most commonly referred to as \"\"proxy\"\" in the paleoclimate community"
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/D18O"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#partOfCompilation",
                    "@type": "owl:ObjectProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answer the question: Which compilation does a dataset belong to?"
                    },
                    "rdfs:domain": {
                        "@id": "http://linked.earth/ontology#Dataset"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "part of compilation"
                    },
                    "rdfs:range": {
                        "@id": "http://linked.earth/ontology#Compilation"
                    },
                    "rdfs:subPropertyOf": [
                        {
                            "@id": "dcterms:isPartOf"
                        },
                        {
                            "@id": "schema:includedInDataCatalog"
                        }
                    ],
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Links the dataset to the compilation"
                    }
                },
                {
                    "@id": "http://linked.earth/ontology#method",
                    "@type": "owl:DatatypeProperty",
                    "rdfs:comment": {
                        "@language": "en",
                        "@value": "Answers the question: How is the information obtained from the resource?"
                    },
                    "rdfs:domain": {
                        "@id": "_:Nb79a202e2b8f49aaadcb9bc9bff4c713"
                    },
                    "rdfs:label": {
                        "@language": "en",
                        "@value": "method"
                    },
                    "rdfs:range": {
                        "@id": "xsd:string"
                    },
                    "vaem:rationale": {
                        "@language": "en",
                        "@value": "Allows to describe methods."
                    },
                    "vann:example": {
                        "@id": "http://wiki.linked.earth/A7.Sun.2005.paleo1measurement1.d18og"
                    }
                }
            ]
        };
    }),


  }; // end return

}());
