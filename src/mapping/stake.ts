import { BigInt, log } from '@graphprotocol/graph-ts';
import { getOrInitDelegate } from '../helpers/initializers';
import {
  VOTING_POWER,
  BIGINT_ZERO,
  ZERO_ADDRESS,
  VOTING_CONSTANT,
  PROPOSITION_CONSTANT,
  STKREX_CONSTANT,
} from '../utils/constants';
import { Delegate, Delegation } from '../../generated/schema';
import { toDecimal } from '../utils/converters';
import { DelegateChanged, Transfer } from '../../generated/StakedTokenV3/StakedTokenV3';

enum PowerType {
  Voting,
  Proposition,
  Both,
}

function retotal(
  delegate: Delegate,
  timestamp: BigInt,
  powerType: PowerType = PowerType.Both
): void {
  if (powerType === PowerType.Voting || powerType === PowerType.Both) {
    delegate.stkRexTotalVotingPowerRaw = delegate.stkRexBalanceRaw
      .plus(delegate.stkRexDelegatedInVotingPowerRaw)
      .minus(delegate.stkRexDelegatedOutVotingPowerRaw);
    delegate.stkRexTotalVotingPower = toDecimal(delegate.stkRexTotalVotingPowerRaw);
    delegate.totalVotingPowerRaw = delegate.stkRexTotalVotingPowerRaw.plus(
      delegate.rexTotalVotingPowerRaw
    );
    delegate.totalVotingPower = toDecimal(delegate.totalVotingPowerRaw);
  }
  if (powerType === PowerType.Proposition || powerType === PowerType.Both) {
    delegate.stkRexTotalPropositionPowerRaw = delegate.stkRexBalanceRaw
      .plus(delegate.stkRexDelegatedInPropositionPowerRaw)
      .minus(delegate.stkRexDelegatedOutPropositionPowerRaw);
    delegate.stkRexTotalPropositionPower = toDecimal(delegate.stkRexTotalPropositionPowerRaw);
    delegate.totalPropositionPowerRaw = delegate.stkRexTotalPropositionPowerRaw.plus(
      delegate.rexTotalPropositionPowerRaw
    );
    delegate.totalPropositionPower = toDecimal(delegate.totalPropositionPowerRaw);
  }
  delegate.lastUpdateTimestamp = timestamp.toI32();
  delegate.save();
}

export function handleTransfer(event: Transfer): void {
  let fromAddress = event.params.from.toHexString();
  let toAddress = event.params.to.toHexString();

  // fromHolder
  if (fromAddress != ZERO_ADDRESS) {
    let fromHolder = getOrInitDelegate(fromAddress);
    fromHolder.stkRexBalanceRaw = fromHolder.stkRexBalanceRaw.minus(event.params.value);
    fromHolder.stkRexBalance = toDecimal(fromHolder.stkRexBalanceRaw);

    if (fromHolder.stkRexBalanceRaw < BIGINT_ZERO) {
      log.error('Negative balance on holder {} with balance {}', [
        fromHolder.id,
        fromHolder.stkRexBalanceRaw.toString(),
      ]);
    }

    if (fromHolder.stkRexVotingDelegate != fromHolder.id) {
      let votingDelegate = getOrInitDelegate(fromHolder.stkRexVotingDelegate);
      votingDelegate.stkRexDelegatedInVotingPowerRaw = votingDelegate.stkRexDelegatedInVotingPowerRaw.minus(
        event.params.value
      );
      votingDelegate.stkRexDelegatedInVotingPower = toDecimal(
        votingDelegate.stkRexDelegatedInVotingPowerRaw
      );
      retotal(votingDelegate, event.block.timestamp, PowerType.Voting);
      fromHolder.stkRexDelegatedOutVotingPowerRaw = fromHolder.stkRexDelegatedOutVotingPowerRaw.minus(
        event.params.value
      );
      fromHolder.stkRexDelegatedOutVotingPower = toDecimal(
        fromHolder.stkRexDelegatedOutVotingPowerRaw
      );
    }

    if (fromHolder.stkRexPropositionDelegate != fromHolder.id) {
      let propositionDelegate = getOrInitDelegate(fromHolder.stkRexPropositionDelegate);
      propositionDelegate.stkRexDelegatedInPropositionPowerRaw = propositionDelegate.stkRexDelegatedInPropositionPowerRaw.minus(
        event.params.value
      );
      propositionDelegate.stkRexDelegatedInPropositionPower = toDecimal(
        propositionDelegate.stkRexDelegatedInPropositionPowerRaw
      );
      retotal(propositionDelegate, event.block.timestamp, PowerType.Proposition);
      fromHolder.stkRexDelegatedOutPropositionPowerRaw = fromHolder.stkRexDelegatedOutPropositionPowerRaw.minus(
        event.params.value
      );
      fromHolder.stkRexDelegatedOutPropositionPower = toDecimal(
        fromHolder.stkRexDelegatedOutPropositionPowerRaw
      );
    }
    retotal(fromHolder, event.block.timestamp);
  }

  // toHolder
  if (toAddress != ZERO_ADDRESS) {
    let toHolder = getOrInitDelegate(toAddress);
    toHolder.stkRexBalanceRaw = toHolder.stkRexBalanceRaw.plus(event.params.value);
    toHolder.stkRexBalance = toDecimal(toHolder.stkRexBalanceRaw);

    if (toHolder.stkRexVotingDelegate != toHolder.id) {
      let votingDelegate = getOrInitDelegate(toHolder.stkRexVotingDelegate);
      votingDelegate.stkRexDelegatedInVotingPowerRaw = votingDelegate.stkRexDelegatedInVotingPowerRaw.plus(
        event.params.value
      );
      votingDelegate.stkRexDelegatedInVotingPower = toDecimal(
        votingDelegate.stkRexDelegatedInVotingPowerRaw
      );
      retotal(votingDelegate, event.block.timestamp, PowerType.Voting);
      toHolder.stkRexDelegatedOutVotingPowerRaw = toHolder.stkRexDelegatedOutVotingPowerRaw.plus(
        event.params.value
      );
      toHolder.stkRexDelegatedOutVotingPower = toDecimal(
        toHolder.stkRexDelegatedOutVotingPowerRaw
      );
    }

    if (toHolder.stkRexPropositionDelegate != toHolder.id) {
      let propositionDelegate = getOrInitDelegate(toHolder.stkRexPropositionDelegate);
      propositionDelegate.stkRexDelegatedInPropositionPowerRaw = propositionDelegate.stkRexDelegatedInPropositionPowerRaw.plus(
        event.params.value
      );
      propositionDelegate.stkRexDelegatedInPropositionPower = toDecimal(
        propositionDelegate.stkRexDelegatedInPropositionPowerRaw
      );
      retotal(propositionDelegate, event.block.timestamp, PowerType.Proposition);
      toHolder.stkRexDelegatedOutPropositionPowerRaw = toHolder.stkRexDelegatedOutPropositionPowerRaw.plus(
        event.params.value
      );
      toHolder.stkRexDelegatedOutPropositionPower = toDecimal(
        toHolder.stkRexDelegatedOutPropositionPowerRaw
      );
    }
    retotal(toHolder, event.block.timestamp);
  }
}

export function handleDelegateChanged(event: DelegateChanged): void {
  let delegator = getOrInitDelegate(event.params.delegator.toHexString());
  let newDelegate = getOrInitDelegate(event.params.delegatee.toHexString());
  let delegationId =
    delegator.id + ':' + newDelegate.id + ':stkrex:' + event.transaction.hash.toHexString();
  let delegation = new Delegation(delegationId);
  delegation.user = delegator.id;
  delegation.timestamp = event.block.timestamp.toI32();
  delegation.delegate = newDelegate.id;
  delegation.asset = STKREX_CONSTANT;
  delegation.amountRaw = delegator.rexBalanceRaw;
  delegation.amount = delegator.rexBalance;

  if (event.params.delegationType == VOTING_POWER) {
    delegation.powerType = VOTING_CONSTANT;
    let previousDelegate = getOrInitDelegate(delegator.stkRexVotingDelegate);
    // Subtract from previous delegate if delegator was not self-delegating
    if (previousDelegate.id != delegator.id) {
      previousDelegate.stkRexDelegatedInVotingPowerRaw = previousDelegate.stkRexDelegatedInVotingPowerRaw.minus(
        delegator.stkRexBalanceRaw
      );
      previousDelegate.stkRexDelegatedInVotingPower = toDecimal(
        previousDelegate.stkRexDelegatedInVotingPowerRaw
      );
    }

    // Add to new delegate if delegator is not delegating to themself, and set delegatedOutPower accordingly
    if (newDelegate.id === delegator.id) {
      delegator.stkRexDelegatedOutVotingPowerRaw = BIGINT_ZERO;
      delegator.stkRexDelegatedOutVotingPower = toDecimal(
        delegator.stkRexDelegatedOutVotingPowerRaw
      );
    } else {
      delegator.stkRexDelegatedOutVotingPowerRaw = delegator.stkRexBalanceRaw;
      delegator.stkRexDelegatedOutVotingPower = toDecimal(
        delegator.stkRexDelegatedOutVotingPowerRaw
      );
      newDelegate.stkRexDelegatedInVotingPowerRaw = newDelegate.stkRexDelegatedInVotingPowerRaw.plus(
        delegator.stkRexBalanceRaw
      );
      newDelegate.stkRexDelegatedInVotingPower = toDecimal(
        newDelegate.stkRexDelegatedInVotingPowerRaw
      );
    }

    retotal(previousDelegate, event.block.timestamp, PowerType.Voting);
    delegator.stkRexVotingDelegate = newDelegate.id;
    retotal(delegator, event.block.timestamp, PowerType.Voting);
    retotal(newDelegate, event.block.timestamp, PowerType.Voting);
  } else {
    delegation.powerType = PROPOSITION_CONSTANT;
    let previousDelegate = getOrInitDelegate(delegator.stkRexPropositionDelegate);
    // Subtract from previous delegate if delegator was not self-delegating
    if (previousDelegate.id != delegator.id) {
      previousDelegate.stkRexDelegatedInPropositionPowerRaw = previousDelegate.stkRexDelegatedInPropositionPowerRaw.minus(
        delegator.stkRexBalanceRaw
      );
      previousDelegate.stkRexDelegatedInPropositionPower = toDecimal(
        previousDelegate.stkRexDelegatedInPropositionPowerRaw
      );
    }

    // Add to new delegate if delegator is not delegating to themself, and set delegatedOutPower accordingly
    if (newDelegate.id === delegator.id) {
      delegator.stkRexDelegatedOutPropositionPowerRaw = BIGINT_ZERO;
      delegator.stkRexDelegatedOutPropositionPower = toDecimal(
        delegator.stkRexDelegatedOutPropositionPowerRaw
      );
    } else {
      delegator.stkRexDelegatedOutPropositionPowerRaw = delegator.stkRexBalanceRaw;
      delegator.stkRexDelegatedOutPropositionPower = toDecimal(
        delegator.stkRexDelegatedOutPropositionPowerRaw
      );
      newDelegate.stkRexDelegatedInPropositionPowerRaw = newDelegate.stkRexDelegatedInPropositionPowerRaw.plus(
        delegator.stkRexBalanceRaw
      );
      newDelegate.stkRexDelegatedInPropositionPower = toDecimal(
        newDelegate.stkRexDelegatedInPropositionPowerRaw
      );
    }
    delegation.save();
    retotal(previousDelegate, event.block.timestamp, PowerType.Proposition);
    delegator.stkRexPropositionDelegate = newDelegate.id;
    retotal(delegator, event.block.timestamp, PowerType.Proposition);
    retotal(newDelegate, event.block.timestamp, PowerType.Proposition);
  }
}
