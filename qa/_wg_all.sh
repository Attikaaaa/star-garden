#!/bin/sh
# Every Wildgrove check in a row. sh qa/_wg_all.sh
cd "$(dirname "$0")/.." || exit 1
fail=0
for t in _wg_gen _wg_store _wg_recipes _wg_bot _wg_boss _wg_touch _wg_soak _wg_perf _wg_net _wg_perm _wg_sky _wg_machines _wg_trader _wg_grave _wg_pet _wg_chase _wg_wear; do
  out=$(node qa/$t.mjs 2>&1 | tail -2 | tr '\n' ' ' | cut -c1-200)
  case "$t" in
    _wg_gen|_wg_bot) ok=$(echo "$out" | grep -c '\[\]\|errors \[\]\|"deterministic":true') ;;
    *) ok=$(echo "$out" | grep -c 'OK') ;;
  esac
  if [ "$ok" -ge 1 ]; then echo "ok   $t"; else echo "FAIL $t: $out"; fail=1; fi
done
[ $fail = 0 ] && echo "ALL WILDGROVE CHECKS OK"
exit $fail
