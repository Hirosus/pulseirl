-- Redis Atomic Release Lua Script
-- KEYS[1]: event_capacity_key
-- KEYS[2]: user_lease_key

local capKey = KEYS[1]
local leaseKey = KEYS[2]

if redis.call('EXISTS', leaseKey) == 1 then
  local slots = tonumber(redis.call('HGET', leaseKey, 'slots') or '1')
  redis.call('DEL', leaseKey)
  local newCap = redis.call('INCRBY', capKey, slots)
  return {1, newCap, 'LEASE_RELEASED'}
else
  return {0, 0, 'LEASE_NOT_FOUND'}
end
