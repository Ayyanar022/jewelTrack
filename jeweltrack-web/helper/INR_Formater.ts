

export const  INRFormat = (number:number)=>{

    const num :number = Math.round(number)
    
  return  new Intl.NumberFormat('en-IN',{
        style:"currency",
        currency:"INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num)
    
}