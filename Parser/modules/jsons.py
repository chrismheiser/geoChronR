import json

EMPTY = ['', ' ', None, 'n/a', 'na', 'nan']


def write_json_to_file(filename, json_data):
    """
    Write all JSON in python dictionary to a new json file.
    :param json_data: JSON data to be written
    :return: None
    """
    with open(filename, 'w+') as f:
        json.dump(json_data, f, indent=2, sort_keys=True)
    return


def import_json_from_file(filename):
    """
    Import the JSON data from target file.
    :param filename: (str) Target File
    :return: (dict) Dictionary of JSON data
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


def remove_csv_from_json(d_master):
    """
    Remove all CSV data 'values' entries from paleoData table in the JSON structure.
    :return: (dict) Metadata dictionary without CSV values
    """
    d = {}
    # Loop through each table in paleoData
    for table in d_master['paleoData']:
        try:
            # try to delete the values key entry
            del d_master['paleoData'][table]['values']
        except ValueError:
            # if the key doesn't exist, keep going
            pass
    return d


def remove_empties(d):
    """
    Remove empty entries from a dictionary.
    :param d: (dict)
    :return:
    """
    for x in list(d.keys()):
        if d[x] in EMPTY:
            del d[x]
    return
