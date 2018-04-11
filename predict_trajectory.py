import os, os.path
import random
import string
import cherrypy
import webbrowser
import json
from collections import OrderedDict
from geopy.distance import vincenty
import pickle
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn.apionly as sns
import math
from sklearn import svm
import numpy as np
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn import svm
import csv


sac=[40.914299, -73.124775]
newcs=[40.912669, -73.123681]
oldcs=[40.912937, -73.122211]
westg=[40.911790, -73.132915]
class ProcessData(object):
    @cherrypy.expose
    def index(self):
        return open('index.html')
    @cherrypy.expose
    def process(self):
        return data
	#cherrypy.response.headers['Content-Type']='application/json'
def get_count_from_csv(f):
    i=0
    for row in f:
        i=i+1
    return i
## Reading the data and creating the dataframe
location_Map= {'SAC':1,'Old CS':2,'West G':3,'NCS':4,'LIRR':5}
location_Map2= {1:'SAC',2:'Old CS',3:'West G',4:'NCS',5:'LIRR'}
def extract_cols():
    col= list()
    for i in range(0,50):
        col.append('Latitude')
        col.append('Longitude')
    col.append('Start')
    return col

def extract_data(data):
    max_rows= 100
    row = data.shape[0]
    one_row_list=list()
    interval = math.ceil(row/max_rows)
    interval = interval*2
    for j in range(0,row,interval):
        one_row_list.append(data.loc[j,'Latitude'])
        one_row_list.append(data.loc[j,'Longitude'])   
    if len(one_row_list) < 100 :
        while(len(one_row_list) != 100):
            one_row_list.append(data.loc[j,'Latitude'])
            one_row_list.append(data.loc[j,'Longitude'])
    one_row_list.append(data.loc[j,'Start'])
    return one_row_list


def cleanData(data):
    global location_Map
    data = data.loc[:,['Latitude','Longitude','Speed','Mode','Timestamp','Start']]
    #data=data.loc[:,['Latitude','Longitude']]
    data = data.dropna(how='all')
    data['Speed'] = data['Speed'].fillna(0)
    data= data.reset_index(drop=True)
    data['Latitude'] = pd.to_numeric(data['Latitude'])
    data['Longitude'] = pd.to_numeric(data['Longitude'])
    prediction_list= extract_data(data)
    prediction_df = pd.DataFrame([prediction_list],columns=extract_cols() )
    prediction_df = prediction_df.replace({"start": location_Map})
    return prediction_df

def normalizeData(data):
    m= pd.read_csv('mean_std.csv')
    m = m.transpose()
    some_list =list()
    for i in range(0,100):
        value = (data.iloc[0,i] - m.iloc[0,i]) / m.iloc[1,i]
        some_list.append(value)
    some_list.append(data.iloc[0,100])
    df = pd.DataFrame([some_list],columns=extract_cols() )
    return df
def finalRoutePredict(filename):
    data = pd.read_csv(filename)
    prediction_df = cleanData(data)
    prediction_df = normalizeData(prediction_df)
    filename = 'svm_route_PredictionModel.sav'
    svmModel = pickle.load(open(filename, 'rb'))
    p = svmModel.predict(prediction_df.iloc[:, :(prediction_df.shape[1] - 1)])
    return (location_Map2.get(p[0]))
############# ETA calculation ############################
def normalizeData2(data):
    m= pd.read_csv('Lat_long_mean_std.csv')
    data['Latitude'] = (data['Latitude'] - m.iloc[0,0])/m.iloc[1,0]
    data['Longitude'] = (data['Longitude'] - m.iloc[2,0])/m.iloc[3,0]
    return data
def timeLeftPredictor(filename):
    data = pd.read_csv(filename)
    data = data[['Latitude','Longitude','Mode','Start','Stop']]
    data = normalizeData2(data)
    data = data.replace({"Start": location_Map,"Stop": location_Map})
    data.loc[:,'Mode'] =np.where(data.loc[:, 'Mode'] == 'Walk',1,2)
    filename = 'timeLeftPredictionModel.sav'
    linearreg = pickle.load(open(filename, 'rb'))
    p = linearreg.predict(data.iloc[:, :(data.shape[1] - 1)])
    return p
######Anomaly detection ######
def detectAnomaly(filename):
    data = pd.read_csv(filename)
    data = cleanData(data)
    anomaly_list= extract_data(data)
    anomaly_df = pd.DataFrame(anomaly_list, columns=extract_cols())
    anomaly_df = anomaly_df.replace({"Start": location_Map})
    filename = 'Anomaly_detector.sav'
    OneClassSVM_model = pickle.load(open(filename, 'rb'))
    y_pred = OneClassSVM_model.predict(anomaly_df)
    return y_pred

def findTravelMode(speed):
    if speed > 2:
        return 'BUS'
    else: 
        return 'Walk'
def getCurrentRoute(filename):
    data = pd.read_csv(filename)
    prediction_df = cleanData(data)
    return prediction_df

@cherrypy.expose
class ProcessDataWebservice(object):
    @cherrypy.tools.json_out()
    def POST(self,location):
        anomaly =0
        result={}
        eta = ""
        start_loc = ""
        route = ""
        count=0
        expected_destination = ""
        cherrypy.session["lat_lon"]=0;
        min_d=1000
        mode_of_travel = ""
        data=json.loads(location)
        lat_lon=[data["Latitude"],data["Longitude"]]
        sac_miles=vincenty(lat_lon, sac).miles
        westg_miles=vincenty(lat_lon, westg).miles
        ncs_miles=vincenty(lat_lon, newcs).miles
        oldcs_miles=vincenty(lat_lon, oldcs).miles
        #cherrypy.session["lat_lon"]=cherrypy.session["lat_lon"] + 1
        file1=open("test_data.csv", "a+")
        f = csv.writer(file1)
        #f.writerow([data["Latitude"],data["Longitude"],])
        print("sac_miles",sac_miles)
        if min_d > sac_miles:
            start_loc="SAC"
            min_d=sac_miles
        if min_d > westg_miles:
            start_loc="West G"
            min_d=westg_miles
        if min_d > ncs_miles:
            start_loc="NCS"
            min_d=ncs_miles
        if min_d > oldcs_miles:
            start_loc="OLDCS"
            mid_d=oldcs_miles
        #count=get_count_from_csv(f)
        row_count = sum(1 for row in csv.reader( open('test_data.csv') ) )
        if row_count is 0:
            f.writerow(['Latitude','Longitude','Speed','Mode','Timestamp','Start']) 
        f.writerow([data["Latitude"],data["Longitude"],data["Speed"],"Walk",data["Timestamp"],"WEST G"])
        row_count = sum(1 for row in csv.reader( open('test_data.csv') ) )
        file1.close()
        print(row_count)
        if row_count>70:
            print("yes finally i can get output")
            mode_of_travel = findTravelMode(1)
            route = finalRoutePredict("test_data.csv")
            print(route)
            file2=open("dest_info.csv","w+")
            e= csv.writer(file2)
            e.writerow(['Latitude','Longitude','Mode','Start','Stop'])
            e.writerow([data['Latitude'],data['Longitude'],mode_of_travel,start_loc,route])
            file2.close()
            anomaly = detectAnomaly("test_data.csv")
            #eta = timeLeftPredictor("dest_info.csv")
            #file2=open("dest_info.csv","w+")
            #e= csv.writer(file2)
            #e.writerow([data['Latitude'],data['Longitude'],data['mode'],start_loc,route])
            #file2.close()
            eta = timeLeftPredictor("dest_info.csv")
            #cherrypy.session["lat_lon"] = 0
        if anomaly == -1:
            result["alert_1"] = -1
        else:
            result["alert_1"] = 1
        expected_destination=route
        result["start"]=start_loc
        result["destination"]=route
        result["expected_time"]= eta
        result["mode"]=mode_of_travel
        #needed_data=json.loads(result)
        print(result)
        #print(data["count"])
        #print(cherrypy.session["lat_lon"])
        #print (cherrypy.session["lat_lon"])
        result=json.dumps(result)
        return result
if __name__ == '__main__':
    cherrypy.config.update(
    {'server.socket_host': '0.0.0.0',
    'server.socket_port': 5000,
    'tools.encode.on':True,
    'tools.encode.encoding':'utf-8'})
    conf = {
    '/': {
    'tools.sessions.on': True,
    'tools.staticdir.root': os.path.abspath(os.getcwd())
    },
    '/generator': {
    'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
    'tools.response_headers.on': True,
    'tools.response_headers.headers': [('Content-Type', 'application/json')],
    },
    '/static': {
    'tools.staticdir.on': True,
    'tools.staticdir.dir': './public'
    }
    }
        #cherrypy.quickstart(ProcessData())
    webapp = ProcessData()
    webapp.generator =ProcessDataWebservice()
    cherrypy.quickstart(webapp,'/',conf)
