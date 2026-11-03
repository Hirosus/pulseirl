-- Redis Atomic Reservation Lua Script
-- KEYS[1]: event_capacity_key (e.g. event:ev_1:available)
-- KEYS[2]: user_lease_key (e.g. reserve:ev_1:user_123)
-- ARGV[1]: lease_ttl_seconds (e.g. 300)
-- ARGV[2]: user_id
-- ARGV[3]: request_slots (e.g. 1)

local capKey = KEYS[1]
local leaseKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local userId = ARGV[2]
local reqSlots = tonumber(ARGV[3])

-- Check if user already holds an active lease for this event
if redis.call('EXISTS', leaseKey) == 1 then
  return {0, -1, 'USER_ALREADY_HOLDS_LEASE'}
end

-- Check capacity
local current = tonumber(redis.call('GET', capKey) or '-1')
if current == -1 then
  return {0, -2, 'EVENT_NOT_INITIALIZED'}
end

if current >= reqSlots then
  -- Decrement atomically
  local remaining = redis.call('DECRBY', capKey, reqSlots)
  -- Store lease metadata with TTL
  redis.call('HSET', leaseKey, 'userId', userId, 'slots', reqSlots, 'createdAt', redis.call('TIME')[1])
  redis.call('EXPIRE', leaseKey, ttl)
  return {1, remaining, 'LEASE_ACQUIRED'}
else
  return {0, current, 'CAPACITY_EXHAUSTED'}
end
