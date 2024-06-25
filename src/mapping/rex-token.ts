import { BigInt, log } from '@graphprotocol/graph-ts';
import { DelegateChanged, Transfer } from '../../generated/RexTokenV2/RexTokenV2';
import { Delegate, Delegation } from '../../generated/schema';
import { getOrInitDelegate } from '../helpers/initializers';
import {
  BIGINT_ZERO,
  VOTING_POWER,
  ZERO_ADDRESS,
  VOTING_CONSTANT,
  PROPOSITION_CONSTANT,
  REX_CONSTANT,
} from '../utils/constants';

import { toDecimal } from '../utils/converters';

enum PowerType {
  Voting,
  Proposition,
  Both,
}

// When a users delegated voting/proposition power changes, recompute REX and total voting/proposition power
function retotal(
  delegate: Delegate,
  timestamp: BigInt,
  powerType: PowerType = PowerType.Both
): void {
  if (powerType === PowerType.Voting || powerType === PowerType.Both) {
    delegate.rexTotalVotingPowerRaw = delegate.rexBalanceRaw
      .plus(delegate.rexDelegatedInVotingPowerRaw)
      .minus(delegate.rexDelegatedOutVotingPowerRaw);
    delegate.rexTotalVotingPower = toDecimal(delegate.rexTotalVotingPowerRaw);
    delegate.totalVotingPowerRaw = delegate.rexTotalVotingPowerRaw.plus(
      delegate.stkRexTotalVotingPowerRaw
    );
    delegate.totalVotingPower = toDecimal(delegate.totalVotingPowerRaw);
  }
  if (powerType === PowerType.Proposition || powerType === PowerType.Both) {
    delegate.rexTotalPropositionPowerRaw = delegate.rexBalanceRaw
      .plus(delegate.rexDelegatedInPropositionPowerRaw)
      .minus(delegate.rexDelegatedOutPropositionPowerRaw);
    delegate.rexTotalPropositionPower = toDecimal(delegate.rexTotalPropositionPowerRaw);
    delegate.totalPropositionPowerRaw = delegate.rexTotalPropositionPowerRaw.plus(
      delegate.stkRexTotalPropositionPowerRaw
    );
    delegate.totalPropositionPower = toDecimal(delegate.totalPropositionPowerRaw);
  }
  delegate.lastUpdateTimestamp = timestamp.toI32();
  delegate.save();
}

export function handleTransfer(event: Transfer): void {
  let fromAddress = event.params.from.toHexString();
  let toAddress = event.params.to.toHexString();
  let value = event.params.value;

  // fromHolder
  if (fromAddress != ZERO_ADDRESS) {
    let fromHolder = getOrInitDelegate(fromAddress);
    fromHolder.rexBalanceRaw = fromHolder.rexBalanceRaw.minus(value);
    fromHolder.rexBalance = toDecimal(fromHolder.rexBalanceRaw);

    if (fromHolder.rexBalanceRaw < BIGINT_ZERO) {
      log.error('Negative balance on holder {} with balance {}', [
        fromHolder.id,
        fromHolder.rexBalanceRaw.toString(),
      ]);
    }

    // If a user is delegating their rex voting power to someone else, update the delegate's inVotingPower and the user's outVotingPower
    if (fromHolder.rexVotingDelegate != fromHolder.id) {
      let votingDelegate = getOrInitDelegate(fromHolder.rexVotingDelegate);
      votingDelegate.rexDelegatedInVotingPowerRaw = votingDelegate.rexDelegatedInVotingPowerRaw.minus(
        value
      );
      votingDelegate.rexDelegatedInVotingPower = toDecimal(
        votingDelegate.rexDelegatedInVotingPowerRaw
      );
      retotal(votingDelegate, event.block.timestamp, PowerType.Voting);
      fromHolder.rexDelegatedOutVotingPowerRaw = fromHolder.rexDelegatedOutVotingPowerRaw.minus(
        value
      );
      fromHolder.rexDelegatedOutVotingPower = toDecimal(fromHolder.rexDelegatedOutVotingPowerRaw);
    }

    // If a user is delegating their rex proposition power to someone else, update the delegate's inPropositionPower and user's outPropositionPower
    if (fromHolder.rexPropositionDelegate != fromHolder.id) {
      let propositionDelegate = getOrInitDelegate(fromHolder.rexPropositionDelegate);
      propositionDelegate.rexDelegatedInPropositionPowerRaw = propositionDelegate.rexDelegatedInPropositionPowerRaw.minus(
        value
      );
      propositionDelegate.rexDelegatedInPropositionPower = toDecimal(
        propositionDelegate.rexDelegatedInPropositionPowerRaw
      );
      retotal(propositionDelegate, event.block.timestamp, PowerType.Proposition);

      fromHolder.rexDelegatedOutPropositionPowerRaw = fromHolder.rexDelegatedOutPropositionPowerRaw.minus(
        value
      );
      fromHolder.rexDelegatedOutPropositionPower = toDecimal(
        fromHolder.rexDelegatedOutPropositionPowerRaw
      );
    }

    // Recompute user's voting/proposition power with updated balance and outgoing delegations
    retotal(fromHolder, event.block.timestamp);
  }

  // toHolder
  if (toAddress != ZERO_ADDRESS) {
    let toHolder = getOrInitDelegate(toAddress);
    toHolder.rexBalanceRaw = toHolder.rexBalanceRaw.plus(value);
    toHolder.rexBalance = toDecimal(toHolder.rexBalanceRaw);

    // If a user is delegating their rex voting power to someone else, update the delegate's inVotingPower and the user's outVotingPower
    if (toHolder.rexVotingDelegate != toHolder.id) {
      let votingDelegate = getOrInitDelegate(toHolder.rexVotingDelegate);
      votingDelegate.rexDelegatedInVotingPowerRaw = votingDelegate.rexDelegatedInVotingPowerRaw.plus(
        value
      );
      votingDelegate.rexDelegatedInVotingPower = toDecimal(
        votingDelegate.rexDelegatedInVotingPowerRaw
      );
      retotal(votingDelegate, event.block.timestamp, PowerType.Voting);
      toHolder.rexDelegatedOutVotingPowerRaw = toHolder.rexDelegatedOutVotingPowerRaw.plus(value);
      toHolder.rexDelegatedOutVotingPower = toDecimal(toHolder.rexDelegatedOutVotingPowerRaw);
    }

    // If a user is delegating their rex proposition power to someone else, update the delegate's inPropositionPower and user's outPropositionPower
    if (toHolder.rexPropositionDelegate != toHolder.id) {
      let propositionDelegate = getOrInitDelegate(toHolder.rexPropositionDelegate);
      propositionDelegate.rexDelegatedInPropositionPowerRaw = propositionDelegate.rexDelegatedInPropositionPowerRaw.plus(
        value
      );
      propositionDelegate.rexDelegatedInPropositionPower = toDecimal(
        propositionDelegate.rexDelegatedInPropositionPowerRaw
      );
      retotal(propositionDelegate, event.block.timestamp, PowerType.Proposition);
      toHolder.rexDelegatedOutPropositionPowerRaw = toHolder.rexDelegatedOutPropositionPowerRaw.plus(
        value
      );
      toHolder.rexDelegatedOutPropositionPower = toDecimal(
        toHolder.rexDelegatedOutPropositionPowerRaw
      );
    }
    // Recompute user's voting/proposition power with updated balance and outgoing delegations
    retotal(toHolder, event.block.timestamp);
  }
}

export function handleDelegateChanged(event: DelegateChanged): void {
  let delegator = getOrInitDelegate(event.params.delegator.toHexString());
  let newDelegate = getOrInitDelegate(event.params.delegatee.toHexString());
  let delegationId =
    delegator.id + ':' + newDelegate.id + ':rex:' + event.transaction.hash.toHexString();
  let delegation = new Delegation(delegationId);
  delegation.user = delegator.id;
  delegation.timestamp = event.block.timestamp.toI32();
  delegation.delegate = newDelegate.id;
  delegation.asset = REX_CONSTANT;
  delegation.amountRaw = delegator.rexBalanceRaw;
  delegation.amount = delegator.rexBalance;

  if (event.params.delegationType == VOTING_POWER) {
    delegation.powerType = VOTING_CONSTANT;
    let previousDelegate = getOrInitDelegate(delegator.rexVotingDelegate);

    // Subtract from previous delegate if user was not self-delegating
    if (previousDelegate.id != delegator.id) {
      previousDelegate.rexDelegatedInVotingPowerRaw = previousDelegate.rexDelegatedInVotingPowerRaw.minus(
        delegator.rexBalanceRaw
      );
      previousDelegate.rexDelegatedInVotingPower = toDecimal(
        previousDelegate.rexDelegatedInVotingPowerRaw
      );
      previousDelegate.usersVotingRepresentedAmount =
        previousDelegate.usersVotingRepresentedAmount - 1;
      retotal(previousDelegate, event.block.timestamp, PowerType.Voting);
    }
    // If newDelegate is not self, update delegate's inVotingPower and user's outVotingPower, else set user's outVotingPower to 0
    if (newDelegate.id === delegator.id) {
      delegator.rexDelegatedOutVotingPowerRaw = BIGINT_ZERO;
      delegator.rexDelegatedOutVotingPower = toDecimal(delegator.rexDelegatedOutVotingPowerRaw);
    } else {
      delegator.rexDelegatedOutVotingPowerRaw = delegator.rexBalanceRaw;
      delegator.rexDelegatedOutVotingPower = toDecimal(delegator.rexDelegatedOutVotingPowerRaw);
      newDelegate.rexDelegatedInVotingPowerRaw = newDelegate.rexDelegatedInVotingPowerRaw.plus(
        delegator.rexBalanceRaw
      );
      newDelegate.rexDelegatedInVotingPower = toDecimal(newDelegate.rexDelegatedInVotingPowerRaw);
      newDelegate.usersVotingRepresentedAmount = newDelegate.usersVotingRepresentedAmount + 1;
      retotal(newDelegate, event.block.timestamp, PowerType.Voting);
    }

    // Recompute user's voting power and set newDelegate
    delegator.rexVotingDelegate = newDelegate.id;
    retotal(delegator, event.block.timestamp, PowerType.Voting);
  } else {
    delegation.powerType = PROPOSITION_CONSTANT;
    let previousDelegate = getOrInitDelegate(delegator.rexPropositionDelegate);
    // Subtract from previous delegate if user was not self-delegating
    if (previousDelegate.id != delegator.id) {
      previousDelegate.rexDelegatedInPropositionPowerRaw = previousDelegate.rexDelegatedInPropositionPowerRaw.minus(
        delegator.rexBalanceRaw
      );
      previousDelegate.rexDelegatedInPropositionPower = toDecimal(
        previousDelegate.rexDelegatedInPropositionPowerRaw
      );
      previousDelegate.usersPropositionRepresentedAmount =
        previousDelegate.usersPropositionRepresentedAmount - 1;
      retotal(previousDelegate, event.block.timestamp, PowerType.Proposition);
    }

    // If newDelegate is not self, update delegate's inVotingPower and user's outVotingPower, else set user's outVotingPower to 0
    if (newDelegate.id === delegator.id) {
      delegator.rexDelegatedOutPropositionPowerRaw = BIGINT_ZERO;
      delegator.rexDelegatedOutPropositionPower = toDecimal(
        delegator.rexDelegatedOutPropositionPowerRaw
      );
    } else {
      delegator.rexDelegatedOutPropositionPowerRaw = delegator.rexBalanceRaw;
      delegator.rexDelegatedOutPropositionPower = toDecimal(
        delegator.rexDelegatedOutPropositionPowerRaw
      );
      newDelegate.rexDelegatedInPropositionPowerRaw = newDelegate.rexDelegatedInPropositionPowerRaw.plus(
        delegator.rexBalanceRaw
      );
      newDelegate.rexDelegatedInPropositionPower = toDecimal(
        newDelegate.rexDelegatedInPropositionPowerRaw
      );
      newDelegate.usersPropositionRepresentedAmount =
        newDelegate.usersPropositionRepresentedAmount + 1;
      retotal(newDelegate, event.block.timestamp, PowerType.Proposition);
    }
    // Recompute user's proposition power and set newDelegate
    delegator.rexPropositionDelegate = newDelegate.id;
    delegation.save();
    retotal(delegator, event.block.timestamp, PowerType.Proposition);
  }
}
