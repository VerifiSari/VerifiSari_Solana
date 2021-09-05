use borsh::{ BorshDeserialize, BorshSerialize };
use solana_program::{
    log::sol_log_compute_units,
    account_info::{ next_account_info, AccountInfo },
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};
use std::io::ErrorKind::InvalidData;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct VTransaction {
    // pub archive_id: String,
    // pub created_on: String,
    pub tnx_date: String,
    pub txn_type: String,
    pub ref_date: String,
    pub req_type: String,
    pub req_mesg: String


}

//const DUMMY_TX_ID: &str = "0000000000000000000000000000000000000000000";
//const DUMMY_CREATED_ON: &str = "0000000000000000"; 
const DUMMY_TNX_DATE: &str = "0000000000000000";
const DUMMY_TNX_TYPE: &str = "0"; // 'A' = Append Request, 'W' = Write Allow, 'R' = Read Request, 'G' Grant Read access
const DUMMY_REF_DATE: &str = "0000000000000000";
const DUMMY_REQ_TYPE: &str = "0"; // 'J' = Join, 'Q' = Quit, 'P' = Promoted
const DUMMY_REQ_MESG: &str = "                         ";  //25

pub fn get_init_vtransaction() -> VTransaction {
    VTransaction{tnx_date: String::from(DUMMY_TNX_DATE), txn_type: String::from(DUMMY_TNX_TYPE), 
                ref_date: String::from(DUMMY_REF_DATE), req_type: String::from(DUMMY_REQ_TYPE),
                req_mesg: String::from(DUMMY_REQ_MESG)}
}
pub fn get_init_vtransactions() -> Vec<VTransaction> {
    let mut vtransactions = Vec::new();
    for _ in 0..20 {
        vtransactions.push(get_init_vtransaction());
    }
    return vtransactions;
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;
    if account.owner != program_id {
        msg!("This account {} is not owned by this program {} and cannot be updated!", account.key, program_id);
    }

    sol_log_compute_units();

    let instruction_data_vtransaction = VTransaction::try_from_slice(instruction_data).map_err(|err| {
        msg!("Attempt to deserialize instruction data has failed. {:?}", err);
        ProgramError::InvalidInstructionData
    })?;
    msg!("Instruction_data verifisari transaction object {:?}", instruction_data_vtransaction);

    let mut existing_data_vtransactions = match <Vec<VTransaction>>::try_from_slice(&account.data.borrow_mut()) {
        Ok(data) => data,
        Err(err) => {
            if err.kind() == InvalidData {
                msg!("InvalidData so initializing account data");
                get_init_vtransactions()
            } else {
                panic!("Unknown error decoding account data {:?}", err)
            }
        }
    };

    //Find index of first unedited rocrd (location to update)
    let index = existing_data_vtransactions.iter().position(|p| p.tnx_date == String::from(DUMMY_TNX_DATE)).unwrap();
    msg!("Found index {}", index);
    existing_data_vtransactions[index] = instruction_data_vtransaction;
    // set vtransactions object back to vector data
    let updated_data = existing_data_vtransactions.try_to_vec().expect("Failed to encode data."); 
    msg!("Final existing_data_vtransactions[index] {:?}", existing_data_vtransactions[index]);

    //Save data back to the 
    let data = &mut &mut account.data.borrow_mut();
    msg!("Attempting save data.");
    data[..updated_data.len()].copy_from_slice(&updated_data);    
    let saved_data = <Vec<VTransaction>>::try_from_slice(data)?;
    msg!("Verifisari Transaction has been saved to account data. {:?}", saved_data[index]);
    sol_log_compute_units();

    msg!("End program.");
    Ok(())
}

// Sanity tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;
    //use std::mem;

    #[test]
    fn test_sanity() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let vtransactions = get_init_vtransactions(); 
        let mut data = vtransactions.try_to_vec().unwrap();
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );
        
        //let archive_id = "abcdefghijabcdefghijabcdefghijabcdefghijabc";
        let tnx_date = "0001630209205425";
        let txn_type = "A";
        let ref_date = "0001630199161427";
        let req_type = "J";
        let req_mesg = "Senior Engineer          ";
        let instruction_data_vtransaction = VTransaction{ tnx_date: String::from(tnx_date), txn_type: String::from(txn_type), 
            ref_date: String::from(ref_date), req_type: String::from(req_type), req_mesg: String::from(req_mesg)};
        let instruction_data = instruction_data_vtransaction.try_to_vec().unwrap();

        let accounts = vec![account];

        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        let vtransactions = &<Vec<VTransaction>>::try_from_slice(&accounts[0].data.borrow())
        .unwrap()[0];
        let test_tnx_date = &vtransactions.tnx_date;
        let test_txn_type = &vtransactions.txn_type;
        let ref_date = &vtransactions.ref_date;
        let test_req_type = &vtransactions.req_type;
        let test_req_mesg = &vtransactions.req_mesg;
        println!("vtransaction {:?}", &vtransactions);
        // I added first data and expect it to contain the given data
        assert_eq!(
            String::from(tnx_date).eq(test_tnx_date),
            true
        );

        assert_eq!(
            String::from(txn_type).eq(test_txn_type),
            true
        );

        assert_eq!(
            String::from(ref_date).eq(ref_date),
            true
        );

        assert_eq!(
            String::from(req_type).eq(test_req_type),
            true
        );

        assert_eq!(
            String::from(req_mesg).eq(test_req_mesg),
            true
        );
    }
}
