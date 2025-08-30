from flask import Flask, render_template, request, redirect, url_for, jsonify
from email_sender import EmailSender

app = Flask(__name__)
email_sender = EmailSender()


@app.route('/')
def home():
    return render_template("home.html")


@app.route('/learn')
def learn():
    return render_template("learn.html")


@app.route('/about')
def about():
    return render_template("about.html")


@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'GET':
        return render_template("contact.html")
    elif request.method == 'POST': 
        name = request.form['name']
        email = request.form['email']
        number = request.form['number']
        message = request.form['message']
        email_sender.send_email(name=name, email=email,number=number,message=message)
        return render_template("contact.html", msg_sent=True)

@app.route('/results')
def results():
    wpm = request.args.get('wpm', 0, type=int)
    accuracy = request.args.get('accuracy', 0, type=int)
    time_taken = request.args.get('time', 0, type=int)
    correct_chars = request.args.get('correctChars', 0, type=int)
    incorrect_chars = request.args.get('incorrectChars', 0, type=int)
    
    return render_template("results.html", 
                         wpm=wpm, 
                         accuracy=accuracy, 
                         time=time_taken, 
                         correct_chars=correct_chars, 
                         incorrect_chars=incorrect_chars)


if __name__ == "__main__":
    app.run(debug=True, port=5001)
