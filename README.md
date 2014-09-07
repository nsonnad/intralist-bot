##Intralist Bot

This is a Node.js-powered Twitter bot template. Given a list, the bot identifies
and retweets all instances of one list member mentioning
one or more other list members. A list of the members, and a cache of past
retweets, are saved in a local SQLite database.

For an example, check out [diplomatwee](https://twitter.com/diplomatwee), a bot that retweets any time one
world leader mentions another.

Setting up a bot is easy. You'll need recent versions of Node.js and SQLite, a UNIX
terminal, and a fresh Twitter account you plan to use as the bot.

1. Clone this repo: `git clone git@github.com:nsonnad/intralist-bot.git`
2. `npm run setup` to create a local config file and install npm modules
3. With your bot's account, make a new twitter app over at [Twitter developers](https://dev.twitter.com/)
4. Give the app read and write permissions and regenerate your Access Token
5. Fill in the `config.json` file (created in step 2) with your Twitter app
info, your bot's screen name, and the info on the list you'd like your bot to
watch. Make sure the contents of this file remain secret.

Now you can do the following:
* `npm run getListMembers` -  Creates a local database of list members
* `npm run tweetMentions` -  Identifies and retweets mutual mentions

At this point, your bot works locally and is ready to be deployed to a server.
For a free and flexible solution, I suggest giving
[ScraperWiki](https://scraperwiki.com/) a try.

## License

[MIT](LICENSE)
