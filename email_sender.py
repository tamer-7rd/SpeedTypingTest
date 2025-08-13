import smtplib as sm
import os 
from dotenv import load_dotenv
import datetime as dt

load_dotenv()

email_bot = os.getenv("EMAIL_BOT")
email_bot_password = os.getenv("EMAIL_BOT_PASSWORD")
my_email = os.getenv("MY_EMAIL")

now = dt.datetime.now()

class EmailSender():
  def __init__(self):
    self.today = now.today


  def send_email(email, name, number, message):
    with sm.SMTP(host="smtp.gmail.com", port=587) as connection:
      connection.starttls()
      connection.login(user=email_bot, password=email_bot_password)
      connection.sendmail(
        from_addr=email_bot,
        to_addrs=my_email,
        msg = (
          'Subject: Email from your portfolio project "SpeedTypingTest"\n\n'
          f'From:{name},{email},{number}\n'
          f'{message}'
        ))