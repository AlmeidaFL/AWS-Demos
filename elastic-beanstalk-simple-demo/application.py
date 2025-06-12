from flask import Flask

application = Flask(__name__)

@application.route("/")
def hello():
    return "Hello this will crash"

# erro de sintaxe proposital (aspas abertas e linha sem fechamento)
