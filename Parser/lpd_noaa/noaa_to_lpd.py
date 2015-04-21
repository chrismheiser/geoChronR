__author__ = 'chrisheiser1'

from collections import OrderedDict
import json
import os


"""
Be able to convert NOAA format to LPD format
Be able to convert LPD format to NOAA format
Notes:
Data cols and vars do not have "#" on the front

Things to do:
    DONE-Strip the # and the white space on the left and right of strings
    DONE-Try to capture all the info with ":", because that's data we want
    DONE-Figure out how to capture the data cols and maybe put it in a list(?)
    DONE-do you need to lowercase all the strings?
    DONE-Piece together all the dictionaries into the final dictionaries
    DONE-Determine which info from the NOAA text file that we want to keep (waiting on Nick)
    DONE-get rid of K-V's that are in the dictionary blocks. It's adding duplicates at the root level.
    DONE- Get rid of blank values. Stop them from adding to the dictionary
    DONE- Figure out what to do with coreLength val and unit


    HALF DONE-Convert all names to JSONLD naming (method to convert to camel casing)

    IGNORE KEYS: earliestYear, mostRecentYear, dataLine variables
"""


# All path items are automatically strings. If you think it's an int or float, use this to attempt to convert it.
def convert_num(number):
    try:
        return float(number)
    except ValueError:
        return number


# Convert underscore naming into camel case naming
def name_to_camelCase(strings):
    # strings = strings.lower()
    split_word = strings.split('_')
    # for i in range(0, len(split_word)):
    #     if i != 0:
    #         split_word[i] = split_word[i].title()
    strings = ''.join(split_word)
    return strings


# Convert formal titles to camelcase json_ld text that matches our context file
def name_to_jsonld(title):

    if title == '':
         out = ''

    # Northernmost_Latitude -> lat:max
    # Southernmost_Latitude -> lat:min
    # Easternmost_Longitude -> lon:max
    # Westernmost_Longitude -> lon:min
    # Elevation -> elevation:value
    # Elevation -> elevation:units
    # Authors -> pub:authors
    # Date -> pub:date
    # DOI -> pub:DOI
    # Collection_Name -> collectionName
    # NOTES -> comments
    # Site_Name -> siteName
    # Missing Values -> missingValue
    #
    else:
        return

    return out


def split_name_unit(line):
    if ' ' in line:
        line = line.split()
        value = convert_num(line[0])
        unit = line[1]
        return value, unit
    else:
        return None, None


# Remove the unnecessary characters in the line that we don't want
def str_cleanup(line):
    # line = line.lower()
    line = line.rstrip()
    if '#' in line:
        line = line.replace("#", "")
        line = line.lstrip()
    if '-----------' in line:
        line = ''

    return line


# Get the key and value items from a line by looking for and lines that have a ":"
def slice_key_val(line):
    position = line.find(":")
    # If value is -1, that means the item was not found in the string.
    if position != -1:
        key = line[:position]
        value = line[position+1:]
        return key, value
    return


# Parse through the text file grabbing the metadata and data columns
def parse(file):

    # Counters to track what to show what number to append to grant and funding keys
    grants = 1
    funding = 1

    var_count = 0
    create_lists = False

    # All dictionaries needed to create JSON structure
    vars_dict = OrderedDict()
    final_dict = OrderedDict()
    geo = OrderedDict()
    lat = OrderedDict()
    lon = OrderedDict()
    elev = OrderedDict()
    pub = OrderedDict()
    coreLen = OrderedDict()
    data_dict = OrderedDict()

    # List of items that we don't want to output
    ignore = ['EarliestYear', 'MostRecentYear']

    # List of keys that need their values converted to ints/floats
    numbers = ['Volume', 'Value', 'Min', 'Max', 'Pages', 'Edition', 'CoreLength']

    # List of items that need to be split (value, units)
    split = ['CoreLength', 'Elevation']

    # Lists for what keys go in specific dictionary blocks
    lat_lst = ['NorthernmostLatitude', 'SouthernmostLatitude']
    lon_lst = ['EasternmostLongitude', 'WesternmostLongitude']
    geo_lst = ['Location', 'Country']
    elev_lst = ['Elevation']
    pub_lst = ['OnlineResource', 'OriginalSourceUrl', 'Investigators', 'Authors', 'PublishedDateOrYear',
               'PublishedTitle', 'JournalName', 'Volume', 'Doi', 'FullCitation', 'Abstract', 'Pages', 'Edition']

    with open(file, 'r') as f:
        line_num = 0
        missing_val = False

        for line in iter(f):
            line_num += 1

            # Metadata section
            if "#" in line:
                line = str_cleanup(line)

                # Grab the key and value from the current line
                try:
                    # Split the line into key, value pieces
                    key, value = slice_key_val(line)
                    value = value.lstrip()

                    # We need to know if we've hit the missing value line
                    if (key.lower() == 'missing value') or (key.lower() == 'missing values'):
                        missing_val = True

                    # Convert naming to camel case
                    key = name_to_camelCase(key)

                    # Ignore any entries that are specified in the skip list, or any that have empty values
                    if key not in ignore:

                        # Two special cases, because sometimes there's multiple funding agencies and grants
                        # Appending numbers to the names prevents them from overwriting each other in the final dict
                        if key == 'FundingAgencyName':
                            key = key + '-' + str(funding)
                            funding += 1
                        elif key == 'Grant':
                            key = key + '-' + str(grants)
                            grants += 1

                        # Insert into the final dictionary
                        if key in lat_lst:
                            if key == lat_lst[0]:
                                lat['Max'] = convert_num(value)
                            elif key == lat_lst[1]:
                                lat['Min'] = convert_num(value)
                        elif key in lon_lst:
                            if key == lon_lst[0]:
                                lon['Max'] = convert_num(value)
                            elif key == lon_lst[1]:
                                lon['Min'] = convert_num(value)
                        elif key in elev_lst:
                            # Split the elev string into value and units
                            val, unit = split_name_unit(value)
                            elev['Value'] = convert_num(val)
                            elev['Unit'] = unit
                        elif key in geo_lst:
                            geo[key] = value
                        elif key in pub_lst:
                            if key in numbers:
                                pub[key] = convert_num(value)
                            else:
                                pub[key] = value
                        elif key == 'CoreLength':
                            val, unit = split_name_unit(value)
                            coreLen['Value'] = val
                            coreLen['Unit'] = unit
                        else:
                            final_dict[key] = value

                # Ignore any errors from NoneTypes that are returned from slice_key_val
                except TypeError:
                    pass

            # Data Columns
            elif ('#' not in line) and missing_val:
                # Split the line at each space (There's one space between each data item)
                num_list = line.split()

                # For the first loop, we want to take the variable names, count vars, and create the dictionary entries
                if not create_lists:
                    vars_names = []
                    for vars1 in num_list:
                        vars_names.append(vars1)
                        vars_dict[vars1] = []
                        var_count += 1
                    create_lists = True

                # For all other loops, we are dealing with the actual data
                else:
                    # We have simultaneous looping. For each var key, we add the corresponding data item to the val list
                    # Also, converts numbers from str type, back into floats
                    if num_list:
                        for i in range(0, var_count):
                            vars_dict[vars_names[i]].append(convert_num(num_list[i]))




    # Piece together geo block
    geo['Latitude'] = lat
    geo['Longitude'] = lon
    geo['Elevation'] = elev
    final_dict['Geo'] = geo
    final_dict['CoreLength'] = coreLen
    final_dict['Pub'] = pub

     # Insert the data dictionaries into the final dictionary
    for k, v in vars_dict.items():
        data_dict[k] = v

    final_dict['Columns'] = data_dict

    return final_dict


# Main function takes in file name, and outputs new jsonld file
def main():

    file_list = []
    os.chdir('/Users/chrisheiser1/Dropbox/GeoChronR/noaa_lpd_files/')
    for file in os.listdir():
        if file.endswith('.txt'):
            file_list.append(file)

    for txts in file_list:

        # Cut the extension from the file name
        if '-noaa.txt' in txts:
            split = txts.split('-')
        else:
            split = txts.split('.')
        name = split[0]

        # Run the file through the parser
        dict_out = parse(txts)

        # Creates the directory 'output' if it does not already exist
        # path = 'output/' + name
        # if not os.path.exists(path):
        #       os.makedirs(path)

        # LPD file output
        out_name = name + '-lpd.jsonld'
        # file_jsonld = open(path + '/' + out_name, 'w')
        # file_jsonld = open(path + '/' + out_name, 'r+')
        file_jsonld = open('output/' + out_name, 'w')
        file_jsonld = open('output/' + out_name, 'r+')

        # Write finalDict to json-ld file with dump
        # Dump outputs into a human-readable json hierarchy
        json.dump(dict_out, file_jsonld, indent=4)

    return


main()