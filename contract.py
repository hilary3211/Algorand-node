
import algopy
from algopy import Bytes, Global, String, UInt64, arc4, itxn, subroutine


class Level9(algopy.ARC4Contract):


    @arc4.abimethod()
    def app_optin(self, address: algopy.Account , appid: UInt64) -> None:
      
     
    

        itxn.ApplicationCall(
                app_id=appid,
                fee=0,
                apps=(algopy.Application(724672975),),
                on_completion = algopy.OnCompleteAction.OptIn,
                sender=Global.creator_address,

            ).submit()
        call_txn = itxn.Payment(
            sender= Global.creator_address,
            receiver=Global.creator_address,
            amount=0,
            rekey_to=Global.creator_address,
            fee=0,
       
   
            ).submit()
