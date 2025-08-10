# Test comprehensive Vyper constructs
#pragma version ^0.3.0

from vyper.interfaces import ERC20

interface TestInterface:
    def test_method(arg: uint256) -> uint256: view

struct TestStruct:
    field1: uint256
    field2: address

event TestEvent:
    sender: indexed(address)
    amount: uint256

enum Status:
    PENDING
    ACTIVE
    INACTIVE

flag Permissions:
    READ
    WRITE
    EXECUTE

# Constants and variables
CONSTANT_VALUE: constant(uint256) = 100
public_var: public(uint256)
immutable_var: public(immutable(uint256))

implements: TestInterface

exports: (test_method, CONSTANT_VALUE)

@external
@payable
def test_function(param1: uint256, param2: address = ZERO_ADDRESS) -> uint256:
    # Variable declarations
    local_var: uint256 = param1
    
    # Control flow
    if local_var > 0:
        for i: uint256 in range(10):
            if i % 2 == 0:
                local_var += i
            else:
                continue
                
        # Special calls
        result: uint256 = convert(local_var, uint256)
        empty_bytes: bytes32 = empty(bytes32)
        
        # External calls
        token_balance: uint256 = staticcall ERC20(param2).balanceOf(msg.sender)
        
        # Raw call
        response: Bytes[100] = raw_call(
            param2,
            method_id("transfer(address,uint256)"),
            max_outsize=100
        )
        
        log TestEvent(msg.sender, result)
        return result
    else:
        raise "Invalid parameter"

@internal
def _helper_function() -> bool:
    return True

@pure
@internal  
def _pure_function(x: uint256) -> uint256:
    return x * 2