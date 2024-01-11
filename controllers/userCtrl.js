const userModel=require("../models/userModels");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const doctorModel=require("../models/doctorModel");

const registerController=async(req,res)=>{
    try {
        // return res.status(200).send({success:true,message:"YAY"});
        const existingUser=await userModel.findOne({email:req.body.email});
        if(existingUser){
            return res.status(200).send({
                success:false,
                message:"User Already Exists"
            });
        }
        const password=req.body.password;
        const salt=await bcrypt.genSalt(10);
        const hashedPassowrd=await bcrypt.hash(password,salt);
        req.body.password=hashedPassowrd;
        const newUser= new userModel(req.body);
        await newUser.save();
        res.status(201).send({success:true,message:"Registered Successfully"})

    } catch (error) {
        console.log(error);
        // console.log("OUTER BLOCK TRY CATCH");
        res.status(500).send({
            success:false,
            message:`Register Conroller ${error}`
        });
    }
}

const loginController=async(req,res)=>{
    try {
        const user=await userModel.findOne({email:req.body.email});
        if(!user){
            return res.status(200).send({
                success:false,
                message:"User not found"
            });
        }
        console.log(req.body,user);
        const isMatch=await bcrypt.compare(req.body.password,user.password);
        if(!isMatch){
            return res.status(200).send({
                success:false,
                message:"Invalid Email or Password"
            });
        }
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET);
        res.status(200).send({
            success:true,
            message:"Login Success", 
            token
        })

        
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success:false,
            message:`Register Conroller ${error}`
        });
    }
}

const authController=async(req,res)=>{
    // return res.status(300).send({message:"HEY",success:true});
    try {
        const user=await userModel.findOne({_id:req.body.userId});
        user.password=undefined;
        if(!user){
            return res.status(200).send({
                message:"User not found",
                success:false
            })
        }else{
            return res.status(200).send({
                message:"Auth success",
                success:true,
                data:user
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send({message:"something went wrong",success:false});
    }
}

const applyDoctorController= async(req,res)=>{
    try{
        const newDoctor=new doctorModel({...req.body,status:'pending',userId:req.body.userId});
        await newDoctor.save();
        const adminUser=await userModel.findOne({isAdmin:true});
        const notification=adminUser.notification;
        notification.push({
            type:'apply-doctor-request',
            message:`${newDoctor.firstName} ${newDoctor.lastName} has applied for a doctor account`,
            data:{
                doctorId:newDoctor._id,
                name:newDoctor.firstName+" "+newDoctor.lastName,
                onClickPath:"/admin/doctors"
            }
        })
        await userModel.findByIdAndUpdate(adminUser._id,{notification});
        res.status(200).send({
            success:true,
            message:"Doctor Account applied successfully"
        })
    }catch(error){
        console.log(error);
        res.status(500).send({
            success:false, error,
            message:"Error in applying for doctor"
        })
    }
}

module.exports={loginController,registerController,authController,applyDoctorController};