export const fileToBase64 = (file: File, setValue: (base64: string) => void) => {
  var reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    setValue(reader.result as string)
  }
  reader.onerror = (error) => {
    console.log('Error: ', error)
  }
}
