import { Bytes } from '@graphprotocol/graph-ts';
import { Proposal, Delegate } from '../../generated/schema';
import { zeroAddress, zeroBI } from '../utils/converters';
import { BIGINT_ZERO, BIGDECIMAL_ZERO, NA, STATUS_PENDING } from '../utils/constants';

export function getOrInitDelegate(id: string, createIfNotFound: boolean = true): Delegate {
  let delegate = Delegate.load(id);

  if (delegate == null && createIfNotFound) {
    delegate = new Delegate(id);

    delegate.rexBalanceRaw = BIGINT_ZERO;
    delegate.rexBalance = BIGDECIMAL_ZERO;

    delegate.stkRexBalanceRaw = BIGINT_ZERO;
    delegate.stkRexBalance = BIGDECIMAL_ZERO;

    delegate.totalVotingPowerRaw = BIGINT_ZERO;
    delegate.totalVotingPower = BIGDECIMAL_ZERO;

    delegate.totalPropositionPowerRaw = BIGINT_ZERO;
    delegate.totalPropositionPower = BIGDECIMAL_ZERO;

    delegate.rexTotalVotingPowerRaw = BIGINT_ZERO;
    delegate.rexTotalVotingPower = BIGDECIMAL_ZERO;

    delegate.rexTotalPropositionPowerRaw = BIGINT_ZERO;
    delegate.rexTotalPropositionPower = BIGDECIMAL_ZERO;

    delegate.rexDelegatedInVotingPowerRaw = BIGINT_ZERO;
    delegate.rexDelegatedInVotingPower = BIGDECIMAL_ZERO;

    delegate.rexDelegatedOutVotingPowerRaw = BIGINT_ZERO;
    delegate.rexDelegatedOutVotingPower = BIGDECIMAL_ZERO;

    delegate.rexDelegatedInPropositionPowerRaw = BIGINT_ZERO;
    delegate.rexDelegatedInPropositionPower = BIGDECIMAL_ZERO;

    delegate.rexDelegatedOutPropositionPowerRaw = BIGINT_ZERO;
    delegate.rexDelegatedOutPropositionPower = BIGDECIMAL_ZERO;

    delegate.stkRexTotalVotingPowerRaw = BIGINT_ZERO;
    delegate.stkRexTotalVotingPower = BIGDECIMAL_ZERO;

    delegate.stkRexTotalPropositionPowerRaw = BIGINT_ZERO;
    delegate.stkRexTotalPropositionPower = BIGDECIMAL_ZERO;

    delegate.stkRexDelegatedInVotingPowerRaw = BIGINT_ZERO;
    delegate.stkRexDelegatedInVotingPower = BIGDECIMAL_ZERO;

    delegate.stkRexDelegatedOutVotingPowerRaw = BIGINT_ZERO;
    delegate.stkRexDelegatedOutVotingPower = BIGDECIMAL_ZERO;

    delegate.stkRexDelegatedInPropositionPowerRaw = BIGINT_ZERO;
    delegate.stkRexDelegatedInPropositionPower = BIGDECIMAL_ZERO;

    delegate.stkRexDelegatedOutPropositionPowerRaw = BIGINT_ZERO;
    delegate.stkRexDelegatedOutPropositionPower = BIGDECIMAL_ZERO;

    delegate.usersVotingRepresentedAmount = 1;
    delegate.usersPropositionRepresentedAmount = 1;

    delegate.rexVotingDelegate = id;
    delegate.rexPropositionDelegate = id;

    delegate.stkRexVotingDelegate = id;
    delegate.stkRexPropositionDelegate = id;

    delegate.numVotes = zeroBI().toI32();
    delegate.numProposals = zeroBI().toI32();

    delegate.lastUpdateTimestamp = zeroBI().toI32();

    delegate.save();
  }

  return delegate as Delegate;
}

export function getOrInitProposal(proposalId: string): Proposal {
  let proposal = Proposal.load(proposalId);

  if (proposal == null) {
    proposal = new Proposal(proposalId);
    proposal.state = STATUS_PENDING;
    proposal.ipfsHash = NA;
    proposal.user = zeroAddress().toString();
    proposal.executor = NA;
    proposal.targets = [Bytes.fromI32(0) as Bytes];
    proposal.values = [zeroBI()];
    proposal.signatures = [NA];
    proposal.calldatas = [Bytes.fromI32(0) as Bytes];
    proposal.withDelegatecalls = [false];
    proposal.startBlock = zeroBI();
    proposal.endBlock = zeroBI();
    proposal.governanceStrategy = Bytes.fromI32(0) as Bytes;
    proposal.currentYesVote = zeroBI();
    proposal.currentNoVote = zeroBI();
    proposal.timestamp = zeroBI().toI32();
    proposal.lastUpdateTimestamp = zeroBI().toI32();
    proposal.lastUpdateBlock = zeroBI();
    proposal.title = NA;
    proposal.description = NA;
    proposal.shortDescription = NA;
    proposal.govContract = zeroAddress();
    proposal.totalPropositionSupply = zeroBI();
    proposal.totalVotingSupply = zeroBI();
    proposal.createdBlockNumber = zeroBI();
    proposal.totalCurrentVoters = 0;
    proposal.aipNumber = zeroBI();
    proposal.author = NA;
    proposal.discussions = NA;
    proposal.save();
  }

  return proposal as Proposal;
}
