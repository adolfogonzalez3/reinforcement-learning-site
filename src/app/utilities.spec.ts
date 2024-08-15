import { accumulate } from "./utilities"



describe('Testing accumulate', () => {
    it('Test simple string concat', () => {
        const arr = [1, 2, 3, 4, 5]
        
        const result = accumulate(arr, (prev, curr) => `${prev},${curr}`, '0')
        expect(result).toBe('0,1,2,3,4,5')
    })
}) 