
# -*- coding: utf-8 -*- #

from flask import Flask
from flask import render_template
# from pymongo import MongoClient

app = Flask(__name__)

# MONGODB_HOST = 'localhost'
# MONGODB_PORT = 27019
# DB_NAME = 'mulan-stream'
# COLLECTION_NAME = '#7DElDebateDecisivo'
# FIELDS = {}

@app.route("/")
def index():
	return render_template("index.html")


if __name__ == "__main__":
	app.run(host='0.0.0.0', port=5000, debug=True)


	
	