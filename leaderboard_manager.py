import json
import os
from datetime import datetime


class LeaderboardManager():
  def __init__(self):
    self.leaderboard_file = os.path.join('instance', 'leaderboard.json')
    self.max_entries = 50
    self.max_storage = None

  def load_leaderboard(self):  
    if os.path.exists(self.leaderboard_file):
      try: 
        with open(self.leaderboard_file, 'r') as file:
          return json.load(file)
      except (json.JSONDecodeError, FileNotFoundError):
        return []
    return []    

  def save_leaderboard(self, data):
    os.makedirs('instance', exist_ok=True)
    with open(self.leaderboard_file, 'w') as file:
      json.dump(data, file, indent=2)

  def is_duplicate(self, leaderboard, username, wpm, acc, coef):
    for entry in leaderboard:
      if (entry['username'] == username and 
          entry['wpm'] == wpm and 
          entry['accuracy'] == acc and 
          entry['coef'] == coef):
        return True
    return False

  def find_user_position(self, leaderboard, username, wpm, acc, coef):
    user_position = None
    for i, entry in enumerate(leaderboard):
        if (entry['username'] == username and 
          entry['wpm'] == wpm and 
          entry['accuracy'] == acc and 
          entry['coef'] == coef):
          user_position = i + 1
          break
    return user_position  

  def add_to_leaderboard(self, username, email, country, wpm, acc, coef):
    leaderboard = self.load_leaderboard()

    if self.is_duplicate(leaderboard, username, wpm, acc, coef):
      user_position = self.find_user_position(leaderboard, username, wpm, acc, coef)
      return leaderboard, user_position

    new_entry = {
      "username": username,
      "email": email,
      "country": country,
      "wpm": wpm,
      "accuracy": acc,
      "coef": coef,
      "timestamp": datetime.now().isoformat(),
      "date": datetime.now().strftime('%Y-%m-%d %H:%M'),
    }

    leaderboard.append(new_entry)
    leaderboard.sort(key=lambda obj: obj['coef'], reverse=True)
    leaderboard = leaderboard[:self.max_entries]   
    self.save_leaderboard(leaderboard)             

    user_position = self.find_user_position(leaderboard, 
                                            new_entry['username'], 
                                            new_entry['wpm'], 
                                            new_entry['accuracy'], 
                                            new_entry['coef'])

    return leaderboard, user_position