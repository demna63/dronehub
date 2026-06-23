# 🎯 უმარტივესი გზა - 3 ნაბიჯი

## Firebase Console-დან:
1. **დააჭირე**: "View full history" ბმულს (პირველ სურათზე, "Previous releases" სექციაში)
2. იქ უნდა იყოს **"Upload"** ან **"New deployment"** ღილაკი
3. Select folder: `/Users/usser/Desktop/--main/dist`

---

## თუ ეს არ იმუშავა - Terminal მეთოდი:

### Terminal-ში ჩაწერე:
```bash
cd /Users/usser/Desktop/--main
firebase logout
firebase login --no-localhost
```

### როცა ბმულს მოგცემს:
1. გახსენი browser-ში
2. აირჩიე Google account
3. დაკოპირე 5-ნიშნა კოდი (მაგ: "AB1CD")
4. ჩასვი Terminal-ში და Enter

### შემდეგ:
```bash
firebase deploy --only hosting
```

---

## რატომ არ მუშაობს ხანგრძლივი კოდები:
Firebase-მა შეიძლება შეცვალა authentication flow და ახლა მხოლოდ მოკლე session codes-ს იღებს.

---

## ალტერნატივა - Service Account (თუ terminal-იც არ იმუშავა):

Terminal-ში:
```bash
cd /Users/usser/Desktop/--main
firebase init hosting
```
შეკითხვებზე:
- Project? → dronehubgeorgia-a7bd5
- Public directory? → dist
- SPA? → Yes
- Overwrite? → No

შემდეგ:
```bash
firebase deploy
```
