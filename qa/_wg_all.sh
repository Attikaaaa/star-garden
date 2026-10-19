#!/bin/sh
# Every Wildgrove check in a row. sh qa/_wg_all.sh
cd "$(dirname "$0")/.." || exit 1
fail=0
for t in _wg_gen _wg_store _wg_recipes _wg_perf _wg_map _wg_inv _wg_host _wg_cozy _wg_sign _wg_fish _wg_garden _wg_orchard _wg_rest _wg_farm _wg_album _wg_music _wg_post _wg_bugs _wg_home _wg_winter _wg_gaze _wg_breeze _wg_paths _wg_swing _wg_pond _wg_hearth _wg_dairy _wg_trees _wg_hats _wg_grave _wg_pet _wg_chase _wg_wear _wg_list_join; do
  for try in 1 2; do # the two-browser tests ride on public brokers: one retry before calling it a failure
    out=$(node qa/$t.mjs 2>&1 | tail -2 | tr '\n' ' ' | cut -c1-200)
    ok=$(echo "$out" | grep -c ' OK')
    [ "$ok" -ge 1 ] && break
    pkill -f chrome-headless-shell 2>/dev/null; sleep 2
  done
  if [ "$ok" -ge 1 ]; then echo "ok   $t"; else echo "FAIL $t: $out"; fail=1; fi
done
[ $fail = 0 ] && echo "ALL WILDGROVE CHECKS OK"
exit $fail
