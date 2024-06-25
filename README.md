# Rex Governance Subgraph

This subgraph indexes and provides query capabilities for the Rex Governance protocol on the Rollux network.

## Prerequisites

- Node.js (v14.x or later)
- Yarn
- The Graph CLI (`@graphprotocol/graph-cli`)

## Quick Start

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/rex-governance-subgraph.git
   cd rex-governance-subgraph
   ```

2. Install dependencies:

   ```sh
   yarn install
   ```

3. Build the subgraph:

   ```sh
   yarn run generate-types
   yarn run codegen
   yarn run build
   ```

## Development

- Modify `subgraph.yaml`, `schema.graphql`, or files in `src/` as needed.
- Rebuild and redeploy after changes.

## Troubleshooting

- Ensure contract addresses and start blocks are correct in `subgraph.yaml`.
- Verify authentication and Graph Node accessibility.
