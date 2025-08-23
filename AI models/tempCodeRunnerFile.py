ast_long >= LONG_INTERVAL):
                    requests.post(URL, json={"text": last_emotion})
                    last_sent_time[last_emotion] = current_time
                    last_hourly_sent_time[last_emotion] = current_time