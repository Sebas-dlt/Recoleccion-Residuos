from Config.db import init_db
from Config import models

if __name__ == '__main__':
    init_db()
    print('Database initialized (tables created if none existed).')
