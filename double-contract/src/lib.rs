use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::
{account_info::{next_account_info, AccountInfo},
 entrypoint::{ ProgramResult},
 entrypoint,
 pubkey:: Pubkey
};

entrypoint!(process_instruction);

#[derive(BorshDeserialize, BorshSerialize, Debug)]
struct OnChainData{
    count: u32
}

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult{

    let mut iter = accounts.iter();
    let data_account = next_account_info(&mut iter)?;

    let mut counter = OnChainData::try_from_slice(&data_account.data.borrow())?;

    if counter.count == 0 {
        counter.count = 1;
    }else {
        counter.count = counter.count *2;
    }

    counter.serialize(&mut *data_account.data.borrow_mut())?;

    Ok(())

}