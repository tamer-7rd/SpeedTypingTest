from flask import Flask, render_template, request
from email_sender import EmailSender
from leaderboard_manager import LeaderboardManager


app = Flask(__name__)
email_sender = EmailSender()
leaderboard_manager = LeaderboardManager()

@app.route('/')
def home():
    return render_template("home.html")


@app.route('/learn')
def learn():
    return render_template("learn.html")


@app.route('/about')
def about():
    return render_template("about.html")


@app.route('/leaderboard', methods=['GET', 'POST'])
def leaderboard():
    if request.method == 'GET':
        leaderboard_data = leaderboard_manager.load_leaderboard()
        return render_template("leaderboard.html", leaderboard=leaderboard_data)
    
    elif request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        country = request.form['country']
        wpm = float(request.form['wpm'])
        acc = float(request.form['acc'])
        coef = wpm * (acc / 100)
        
        leaderboard_data, user_position = leaderboard_manager.add_to_leaderboard(username, email, country, wpm, acc, coef)
          
        return render_template("leaderboard.html", 
                             leaderboard=leaderboard_data,
                             new_result={
                                 'username': username,
                                 'wpm': wpm,
                                 'acc': acc,
                                 'country': country,
                                 'coef': coef,
                                 'position': user_position
                             })

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
