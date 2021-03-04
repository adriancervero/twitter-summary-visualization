
from nltk.corpus import stopwords
from nltk.tokenize import TweetTokenizer
from geopy.geocoders import Nominatim
import json, sys, string, argparse, pymongo


# mongod --dbpath /home/aceor/TFG/Test/tweets/ --port 27019 --rest


def preprocess(text):
	return TweetTokenizer().tokenize(text.lower())

def getCountry(lat, lon):

	geolocator = Nominatim()
	location = geolocator.reverse(str(lat)+", "+str(lon))
	country = location.raw["address"]["country"]
	return country
    

def read_data(col):

	#tweets = col.find({'retweeted_status': {'$eq':None}})
	tweets = col.find({})

	

	
	stop = stopwords.words('spanish') + ['rt', 'via', 'q', 'va', 'si']

	data = {}
	count = 0
	#maxcount = 3000

	for t in tweets:	

		terms = []
		hashtags = []
		mentions = []
		rt_count = 0
		likes_count = 0;
			

		if 'retweeted_status' in t.keys():
			
			id_str = t["retweeted_status"]["id_str"]

			if id_str in data:
				new_count_rt = t["retweeted_status"]["retweet_count"]
				new_count_likes = t["retweeted_status"]["favorite_count"]
				id_ = t["retweeted_status"]["id_str"]

				old_count_rt = data[id_]["rt_count"]
				old_count_likes = data[id_]["likes_count"]
				
				if new_count_rt > old_count_rt:
					data[id_]["rt_count"] = new_count_rt

				if new_count_likes > old_count_likes:
					data[id_]["likes_count"] = new_count_likes
				continue

			else:
				continue
		

		# Coordinates
		if t['geo']:
			
			geo_json = {
				"type": "Feature",
				"properties": {
					"image":t["user"]["profile_image_url"]},
				"geometry": t["coordinates"]
			}


		else:
			if geo:
				continue
			else:
				geo_json = 0

		# Terms frequency
		for term in preprocess(t['text']):
			if term.startswith('#') and term != "#"+col.name.lower() :
				hashtags.append(term)

			elif term.startswith('@') and len(term) > 1:
				mentions.append(term)

			elif term.isalpha() and term not in stop:
				terms.append(term)

		data[t["id_str"]] = {
			"timestamp":t["created_at"], \
			"geo":geo_json, \
			"term_freq": terms, \
			"hash_freq":hashtags, \
			"mention_freq": mentions, \
			"rt_count": t["retweet_count"],
			"likes_count": t["favorite_count"], \
			"text": t['text'], \
			"name":t["user"]["name"], \
			"user":t["user"]["screen_name"]
		}

		print("Tweets processed: "+str(count), sep=' ', end='\r', flush=True)

		count += 1
		if count >= maxcount:
			break


	filename = col.name+ ".json"
	print("Completed!,",count,"tweets processed.")
	with open('static/'+filename, 'w') as fout:
		fout.write(json.dumps(list(data.values())))

###################################################################################

if __name__ == "__main__":

	parser = argparse.ArgumentParser(description='Process tweets from mongodb.')
	parser.add_argument('-host', metavar='HOST', type=str, help='host name (default: localhost)', default='localhost')
	parser.add_argument('-p', metavar='PORT', type=int, help='port used (default: 27019)', default=27019)
	parser.add_argument('db', metavar='DB_NAME', type=str, help='database name')
	parser.add_argument('coll', metavar='COLLECTION', type=str, help='collection name you want to extract from.')
	parser.add_argument('-g', action='store_true', help='extract just localized tweets. (default = false)')
	parser.add_argument('-m', metavar='max', type=int, default=100000, help='max extracted tweets. (default = 100000)')




	args = parser.parse_args()
	print(args)

	MONGODB_HOST = args.host
	MONGODB_PORT = args.p
	DB_NAME = args.db
	COLLECTION_NAME = args.coll
	maxcount = args.m
	geo = args.g

	try: 
		conn = pymongo.MongoClient(MONGODB_HOST, MONGODB_PORT)
	except pymongo.error.ConnectionFailure:
		print("Connection failed.")
	
	if DB_NAME in conn.database_names():
		db = conn[DB_NAME]
		if COLLECTION_NAME in db.collection_names():
			col = db[COLLECTION_NAME]
			read_data(col)
		else:
			print("ERROR: collection %s not found" % COLLECTION_NAME)
			print("Collections: ", db.collection_names()[1:])
	else:
		print("ERROR: database %s not found." % DB_NAME)
		print("Databases: ", conn.database_names()[:2])





