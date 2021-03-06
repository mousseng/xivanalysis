#!/usr/bin/env bash
echo 'Sending Discord Webhook';
export AUTHOR_NAME="$(git log -1 $CIRCLE_SHA1 --pretty="%aN")";
export BRANCH_OR_PR="$(if [[ ! -z $CIRCLE_PR_NUMBER ]] ; then echo $CIRCLE_BRANCH; else echo "pr/$CIRCLE_PR_NUMBER"; fi)";
export BACKTICK='`';
export TIMESTAMP=$(date --utc +%FT%TZ);
export COMMIT_FORMATTED="[$BACKTICK${CIRCLE_SHA1:0:7}$BACKTICK]($CIRCLE_COMPARE_URL)";
export COMMIT_MESSAGE=$(git log --format=%s -n 1 $CIRCLE_SHA1);
curl -v -H User-Agent:bot -H Content-Type:application/json -d "{\"embeds\":[{\"author\":{\"name\":\"Build #$CIRCLE_BUILD_NUM Passed\",\"url\":\"$CIRCLE_BUILD_URL\"},\"url\":\"$CIRCLE_COMPARE_URL\",\"color\":4303448,\"description\":\"$COMMIT_FORMATTED - $COMMIT_MESSAGE\"}]}" $DISCORD_WEBHOOK_URL;
