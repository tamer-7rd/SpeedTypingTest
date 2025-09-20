from flask import Flask, render_template, request, redirect
from email_sender import EmailSender
from leaderboard_manager import LeaderboardManager
import math

# JavaScript-style rounding function to match frontend calculations
def js_round(x):
    return math.floor(x + 0.5)

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
        try:
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
        except (ValueError, KeyError):
            return "Bad Request", 400

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
    wpm = request.args.get('wpm', default=None, type=int)
    accuracy = request.args.get('accuracy', default=None, type=int)
    time_taken = request.args.get('time', default=None, type=int)
    correct_chars = request.args.get('correctChars', default=None, type=int)
    incorrect_chars = request.args.get('incorrectChars', default=None, type=int)

    # Validate that all required parameters are present
    if None in (wpm, accuracy, time_taken, correct_chars, incorrect_chars):
        return redirect('/')

    # Validate that all values are non-negative
    if any(value < 0 for value in (wpm, accuracy, time_taken, correct_chars, incorrect_chars)):
        return redirect('/')

    # Validate that test was actually taken (has characters typed and time > 0)
    total_chars = correct_chars + incorrect_chars
    if total_chars == 0 or time_taken <= 0:
        return redirect('/')

    # Validate WPM calculation matches frontend calculation
    expected_wpm = js_round(((correct_chars / 5) / time_taken) * 60)
    if expected_wpm != wpm:
        return redirect('/')

    # Validate accuracy calculation matches frontend calculation
    calculated_accuracy = js_round(correct_chars * 100 / (correct_chars + incorrect_chars))
    if calculated_accuracy != accuracy:
        return redirect('/')

    return render_template("results.html", 
                         wpm=wpm, 
                         accuracy=accuracy, 
                         time=time_taken, 
                         correct_chars=correct_chars, 
                         incorrect_chars=incorrect_chars)


if __name__ == "__main__":
    app.run(debug=True, port=5001)
