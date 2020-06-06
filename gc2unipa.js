// File APIに対応しているか確認
if (window.File && window.FileReader && window.FileList && window.Blob) {

    let file, result, class_id, class_date, class_period;

    window.onload = function () {
        //今日の日時を表示
        let date = new Date()
        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()

        function toTwoDigits(num, digit) {
            num += ''
            if (num.length < digit) {
                num = '0' + num
            }
            return num
        }

        let yyyy = toTwoDigits(year, 4)
        let mm = toTwoDigits(month, 2)
        let dd = toTwoDigits(day, 2)
        let ymd = yyyy + "-" + mm + "-" + dd;

        document.getElementById("class_date").value = ymd;

        file = document.getElementById('file1');
        result = document.getElementById('result');

        file.addEventListener('change', loadLocalCsv, false);

        loadClassIds()
    }

    function loadClassIds(){
        let class_ids = JSON.parse(localStorage.getItem('class_ids'))
        if (class_ids) {

            //授業コードの重複を削除する（2020/6/2）
            class_ids = class_ids.filter(function (x, i, self) {
                return self.indexOf(x) === i;
            });

            //console.log(class_ids);
            let class_ids_tag = document.getElementById('class_ids');
            class_ids_tag.innerHTML = '';
            for (let c of class_ids) {
                let o = document.createElement('option')
                o.value = c
                class_ids_tag.appendChild(o)
            }
        }
    }

    function updateClassIds(){
        let class_ids = JSON.parse(localStorage.getItem('class_ids')) || new Array()
        class_ids.unshift(class_id.value)
        if (class_ids.length > 10) {
            class_ids.splice(10,1)
        }
        localStorage.setItem('class_ids', JSON.stringify(class_ids));
        //console.log("updateClassIds");
    }

    function createStr(data) {
        let r = "";

        data.shift(); //先頭のタイトル行を削除する
        data.sort((a,b)=>{if(a[2]<b[2]) return -1; else return 1; return 0;}) //学籍番号をキーに昇順に並び替える

        for (var i = 0; i < data.length -1; i++) {
//            console.log(i + " : " + data[i].length);
            if (data[i].length <= 1) continue; //Firefoxのソートだと空行が先頭に来るのでそれを無視するための文(2020/6/1)
            r += class_id.value + ","
            r += data[i][2].substring(0, 10) + ","
            r += class_date.value.replace(/-/g, '/') + ","
            r += class_period.value + ","
            if (data[i][4] == '未完了') {
                r += "3," //欠席
            } else {
                r += "0," //出席
            }

            //出席管理には必要ないがCSVに成績も入れるようにした(2020/5/14)
            r += "," + data[i][3] //,,を２個入れているのはユニパでの出席理由説明を飛ばすため

            r += "\n"
        }
        return r
    }

    function download(filename, text) {
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    function loadLocalCsv(e) {
        class_id = document.getElementById('class_id')
        //console.log(class_id.value)
        if (!class_id.value || class_id.value == 'clear') { //特殊コマンドで授業コードDBをクリア（2020/6/2）
            class_ids = [];
            localStorage.setItem('class_ids', JSON.stringify(class_ids));
            class_id.value = '';
            let class_ids_tag = document.getElementById('class_ids');
            class_ids_tag.innerHTML = '';
        }

        if (!class_id.value || class_id.value.match(/[0-9A-Z]{10}/) == null) {
            let class_id_error = document.getElementById('class_id_error')
            if (! class_id_error) {
                class_id_error = document.createElement('div')
                class_id_error.setAttribute('id', 'class_id_error')
                class_id.parentNode.append(class_id_error)
            }
            class_id_error.innerHTML = '授業コードが空欄もしくは間違っています。<br>（正しい授業コードとは、英大文字・数字からなる長さ１０の文字列です。）'
            document.getElementById("file1").value = '';
            return
        } else {
            //エラーメッセージを消す
            let class_id_error = document.getElementById('class_id_error')
            if (class_id_error) {
                class_id_error.innerHTML = ""
            }

            updateClassIds();
            loadClassIds();
        }

        class_date = document.getElementById('class_date');
        class_period = document.getElementById('class_period');

        // ファイル情報を取得
        let fileData = e.target.files[0];

        // CSVファイル以外は処理を止める
        if (!fileData.name.match('.csv$')) {
            alert('CSVファイルを選択してください');
            return;
        }

        // FileReaderオブジェクトを使ってファイル読み込み
        let reader = new FileReader();
        // ファイル読み込みに成功したときの処理
        reader.onload = function () {
            let cols = reader.result.split('\n');
            let data = [];
            for (var i = 0; i < cols.length; i++) {
                data[i] = cols[i].split(',');
            }
            let str = createStr(data);
            result.innerText = str
            download(fileData.name, str)

            //次の入力のためクラスIDとファイル名を消去する
            class_id.value = ""
            document.getElementById("file1").value = ""
        }
        // ファイル読み込みを実行
        reader.readAsText(fileData);
    }

} else {
    file.style.display = 'none';
    result.innerHTML = 'File APIに対応したブラウザでご確認ください';
}
