import json

import demjson

EMPTY = ['', ' ', None, 'na', 'n/a', 'nan', '?']


def write_json_to_file(filename, json_data):
    """
    Write all JSON in python dictionary to a new json file.
    :param filename: (str) Target File
    :param json_data: (dict) JSON data
    :return: None
    """
    # Attempt to sort json keys before calling demjson
    json_data = json.dumps(json_data, sort_keys=True)
    # Use demjson to maintain unicode characters in output
    json_bin = demjson.encode(json_data, encoding='utf-8', compactly=False)
    # Write json to file
    open(filename, "wb").write(json_bin)
    return


def import_json_from_file(filename):
    """
    Import the JSON data from target file.
    :param filename: (str) Target File
    :return: (dict) JSON data
    """
    d = {}
    try:
        # Open json file and read in the contents. Execute DOI Resolver?
        with open(filename, 'r') as f:
            # Load json into dictionary
            d = json.load(f)
    except FileNotFoundError:
        print("LiPD object: Load(). file not found")
    return d


def remove_csv_from_json(d):
    """
    Remove all CSV data 'values' entries from paleoData table in the JSON structure.
    :param d: (dict) JSON data
    :return: (dict) Metadata dictionary without CSV values
    """
    d = {}
    # Loop through each table in paleoData
    for table in d['paleoData']:
        for col in table['columns']:
            try:
                # try to delete the values key entry
                del col['values']
            except KeyError:
                # if the key doesn't exist, keep going
                print("RemoveCSVfromJSON: Error deleting values")
    return d


def remove_empties(d):
    """
    Remove empty entries from a dictionary.
    :param d: (dict)
    :return:
    """
    for x in list(d.keys()):
        # Remove any empty entries
        if d[x] in EMPTY:
            del d[x]
        # Removes trailing new line characters
        d[x] = d[x].rstrip()
    return
